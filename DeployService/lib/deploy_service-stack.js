
const cdk = require('aws-cdk-lib');
const s3assets = require('aws-cdk-lib/aws-s3-assets');
const ec2 = require('aws-cdk-lib/aws-ec2');
const iam = require('aws-cdk-lib/aws-iam');
const path = require('node:path'); 
const logs = require('aws-cdk-lib/aws-logs');

// const sqs = require('aws-cdk-lib/aws-sqs');

class DeployServiceStack extends cdk.Stack {
  /**
   *
   * @param {Construct} scope
   * @param {string} id
   * @param {StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);


      // 👇 create VPC in which we'll launch the Instance
      const vpc = new ec2.Vpc(this, 'my-cdk-vpc', {
          ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
          natGateways: 0,
          subnetConfiguration: [
              { name: 'public', cidrMask: 24, subnetType: ec2.SubnetType.PUBLIC },
          ],
      });


      // 👇 create Security Group for the Instance
      const webserverSG = new ec2.SecurityGroup(this, 'webserver-sg', {
          vpc,
          allowAllOutbound: true,
      });


      // lets use the security group to allow inbound traffic on specific ports
      webserverSG.addIngressRule(
          ec2.Peer.anyIpv4(),
          ec2.Port.tcp(22),
          'Allows SSH access from Internet'
      );

      webserverSG.addIngressRule(
          ec2.Peer.anyIpv4(),
          ec2.Port.tcp(80),
          'allow HTTP traffic from anywhere',
      );

      webserverSG.addIngressRule(
          ec2.Peer.anyIpv4(),
          ec2.Port.tcp(3000),
          'allow HTTP traffic to hit Node Service',
      );

      webserverSG.addIngressRule(
          ec2.Peer.anyIpv4(),
          ec2.Port.tcp(443),
          'allow HTTPS traffic from anywhere',
      );



      // 👇 create a IAM Role for the EC2 Instance
      const serviceRole = new iam.Role(this, 'webserver-role', {
          assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
          managedPolicies: [
              iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
              iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
          ],
      });

      //logging
      // Configure log group for short retention
      const logGroup = new logs.LogGroup(this, 'BrianLogGroup', {
          retention: logs.RetentionDays.ONE_WEEK,
      });

      logGroup.grantWrite(serviceRole);


      //assign keypair usin EC2 key created in AWS dashboard
      const keyPair = ec2.KeyPair.fromKeyPairName(this, 'KeyPair', 'simple-instance-2-key');


      // 👇 create the EC2 Instance
      const ec2Instance = new ec2.Instance(this, 'LatestAl2023', {
          vpc,
          vpcSubnets: {
              subnetType: ec2.SubnetType.PUBLIC,
          },
          role: serviceRole,
          securityGroup: webserverSG,
          instanceName: 'SimpleTestInstance',
          instanceType: ec2.InstanceType.of(
              ec2.InstanceClass.T2,
              ec2.InstanceSize.NANO,
          ),
          machineImage: ec2.MachineImage.latestAmazonLinux2023(),
          keyPair, // use the created key in AWS EC2 dashboard (download to use Putty or SSH)
     
      });

      //--Adding files to S3 
      // Some files should be excluded... .gitignore is a good source.
      const excludePattern = ["node_modules", "dist", ".cdk.staging", "cdk.out", "*.njcsproj", "*.sln"];


      // Step 1: Upload the project code
      const projectAsset = new s3assets.Asset(this, "ProjectFiles", {
          path: path.join(__dirname, "../../ChargerService"),
          exclude: excludePattern
      });

      // Allow EC2 to access the asset.
      projectAsset.grantRead(ec2Instance.role);

      console.log("file path for Prohect : " + path.join(__dirname, "../../ChargerService"));



      // Step 2: Download the project zip file on the instance and get the reference.
      const projectZipFilePath = ec2Instance.userData.addS3DownloadCommand({
          bucket: projectAsset.bucket,
          bucketKey: projectAsset.s3ObjectKey,
      });

      console.log("project zipfile path on ec2 instance : " + projectZipFilePath);

      // Step 3: Upload the configuration user script. Path is relative to this file.
      const configScriptAsset = new s3assets.Asset(this, "ProjectInstanceConfig", {
          path: path.join(__dirname, "user-data-script.sh"),
      });

      // Allow EC2 instance to read the file
      configScriptAsset.grantRead(ec2Instance.role);
  
      console.log("file path for script : " + path.join(__dirname, "user-data-script.sh"));

      // Step 4: Download the project config file get the reference.
      const configScriptFilePath = ec2Instance.userData.addS3DownloadCommand({
          bucket: configScriptAsset.bucket,
          bucketKey: configScriptAsset.s3ObjectKey,
      });

      console.log("configScriptFilePath path on ec2 instance : " + configScriptFilePath);

      // Step 5: Execute the script on the instance passing in the zip reference.
      ec2Instance.userData.addExecuteFileCommand({
          filePath: configScriptFilePath,
          arguments: projectZipFilePath,
      });

  }
}




module.exports = { DeployServiceStack }

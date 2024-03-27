
const cdk = require('aws-cdk-lib');
const s3assets = require('aws-cdk-lib/aws-s3-assets');
const ec2 = require('aws-cdk-lib/aws-ec2');
const rds = require('aws-cdk-lib/aws-rds');
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
          natGateways: 1,
          //subnetConfiguration: [
          //    { name: 'public', cidrMask: 24, subnetType: ec2.SubnetType.PUBLIC },
          //    { name: 'private', cidrMask: 24, subnetType: ec2.SubnetType.PRIVATE },
          //],
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


      // Create the database instance.
      const dbInstance = new rds.DatabaseInstance(this, "chargerdb1", {
          databaseName: "chargerdb1",
          engine: rds.DatabaseInstanceEngine.mysql({ version: rds.MysqlEngineVersion.VER_8_0_36 }),
          vpc: vpc,
          deletionProtection: false,
          storageEncrypted: false,
          storageType: rds.StorageType.GP3,
          instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
          publiclyAccessible: true,
          securityGroups: [webserverSG],
          credentials: rds.Credentials.fromGeneratedSecret('admin')
      });


      // 👇 create a IAM Role for the EC2 Instance
      const serviceRole = new iam.Role(this, 'webserver-role', {
          assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
          managedPolicies: [
              iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
              iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
              iam.ManagedPolicy.fromAwsManagedPolicyName('SecretsManagerReadWrite'),
              iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonRDSDataFullAccess')

          ],
      });

      //logging
      // Configure log group for short retention
      const logGroup = new logs.LogGroup(this, 'BrianLogGroup', {
          retention: logs.RetentionDays.ONE_WEEK,
      });

      logGroup.grantWrite(serviceRole);

      const logStream = new logs.LogStream(this, 'ChargerServiceLogStream', {
          logGroup: logGroup,

          // the properties below are optional
          logStreamName: 'ChargerServiceLogStream',
          removalPolicy: cdk.RemovalPolicy.DESTROY,
      });

    

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
          instanceName: 'chargerEC2',
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
      console.log("file path for Project : " + path.join(__dirname, "../../ChargerService"));


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

      // Step 4: Download the project config file get the reference.
      const configScriptFilePath = ec2Instance.userData.addS3DownloadCommand({
          bucket: configScriptAsset.bucket,
          bucketKey: configScriptAsset.s3ObjectKey,
      });
      console.log("configScriptFilePath path on ec2 instance : " + configScriptFilePath);



      //I can't get this to work right now
      // step 5: Upload service script to S3
      const serviceScriptAsset = new s3assets.Asset(this, "ServiceScript", {
          path: path.join(__dirname, "chargerservice.service"),
      });

      // Allow EC2 instance to read the file
      serviceScriptAsset.grantRead(ec2Instance.role); 


      // Step 6: Download the project config file get the reference.
      const serviceScriptFilePath = ec2Instance.userData.addS3DownloadCommand({
          bucket: serviceScriptAsset.bucket,
          bucketKey: serviceScriptAsset.s3ObjectKey,
      });
      console.log("serviceScriptFilePath path on ec2 instance : " + serviceScriptFilePath);


      // Step 7: Execute the script on the instance passing in the zip reference.
      ec2Instance.userData.addExecuteFileCommand({
          filePath: configScriptFilePath,
          arguments: projectZipFilePath
          //arguments: `${projectZipFilePath} ${serviceScriptFilePath}`
      });

  }
}


module.exports = { DeployServiceStack }

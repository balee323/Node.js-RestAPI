# ChargerService

Dependencies:
-MySql service created prior to deployment of ChargerService
-EC2 key/value pair created prior, named "simple-instance-2-key"
	-** be sure to download the SSH or putty private key when creating the key (you will no have another chance)


Steps to Deploy MySQL service (needs to be done prior to Charger service deployment):
-Go to AWS console, RDS.
-Go to Databases, click ""Create Database"
-Choose a database creation method, select "Easy create"
-select MySQL 
-select "Free tier"
-For DB instance Identifier, name it "chargerdb"
-leave "admin" as username
-for "Credentials management" we will select "Managed in AWS secrets
-keep the "encryption key" as default
-keep all settings as default until "Connectivity" section
-In "Connectivity" section, select "Don't connect to EC2 compute resource"
-"Pubic access" set to yes
-leave all other items as default
-**Be sure to delete Database when done using Charger Service


Steps to add Secrets and Database connection info into ChargerService code:
-After the MySQL database gets created, there will also be a corresponding AWS
secret collection created.  
-Navigate to AWS Secrets on AWS Dashboard
-find the Secret for the newly created Database
	-the secret will be named similar to "rds!db-3b4d33dd-e122-4573-b55c-2b7639a4906f"
-click on the secret name
-click on "retrieve secret value" to see the value.  The charger service will be reading in the secret.
-copy the secret name
-paste the name into ChargerService.AwsSecretsManager.js -> (field) secretName:
-When running the service, your local AWS profile will provide authentication for the charger service to fetch
the secret.




Steps to Deloy Charger Service via AWS CDK (IoC):
-Install Node.js (NPM should be installed automatically alongside Node.js)
-AWS account
-Install AWS CLI on deployment machine
	-https://aws.amazon.com/cli/
	-https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
-AWS Credentials configured on deployment machine (via AWS CLI)
	-Open CMD prompt or shell of on Linux
		-type "aws configure" and enter in access and secrets key.  
		-keep all options as default
-Install AWS CDK
	-in CMD prompt or shell, enter in
		-npm install aws-sdk -g 
		-the g option installs the CDK globally
-Bootstrapping to get ready to use CDK (creates S3 bucket primarily)
	- CMD prompt or shell
		-type "cdk bootstrap"
-run CKD project
	-go into DeployService directory
	-type CDK deploy 
		-deployment will take several minutes.
	-AWS CloudFormation will now create the CDK generated formation stack
	-once complete, you will see the EC2 instance running
		-Please wait at least 5 minutes after a completed CDK deployment before accessing the API
		as serveral installations need to finish on the EC2 instance.

Steps to Delete Deployed application:
-Using CMD Prompt or Shell
	-navigate to the deployment Project Directory
	-type "cdk destroy" to delete the deployment stack


Testing:

Key/Value pair
To access the running EC2 instance via SSH/Putting, be sure to create a key/value pair.
-name the key/pair "simple-instance-2-key" as this is what the deployed EC2 instance is paired with.
-** be sure to download the SSH or putty private key when creating the key (you will no have another chance)


Use Swagger page to test endpoints
	-go to EC2 instance on AWS console dashboard to get public IP address
	-Port for Node Express API service will be port 3000
	-Swagger page:
		-http://{public ip address}:3000/api-docs/
	
Alternatively, use Postman/Insomnia to test endpoints
	-go to EC2 instance on AWS console dashboard to get public IP address
	-Port for Node Express API service will be port 3000

	//gets all chargers
	Get /Chargers/ -> http://{public ip address}:3000/charger/

	//gets charged by id
	Get /Chargers/{id} -> http://{public ip address}:3000/charger/

	//per single charged ID, updates all values or single value 
	put /chargers -> http://{public ip address}:3000/
		required headers -> 
			authorization : {use the hard-coded value guid: 166c2589-3036-4683-be32-e7b2f6aeb324}
		body ->
				{
					"id": 1,
					"name": null,
					"description": "Charger located in Southerish parkinglog.",
					"status": "ACTIVE",
					"location": {"latitude": 38.8951, "longitude": -78.0364},
					"networkProtocol": "OCPP 1.6",
					"publicVisibility": true
				}
    
	//Inserts a new charger (notice ID is not present, the ID auto increments with each new insert).
	post /chargers -> http://{public ip address}:3000/
	required headers -> 
		authorization : {use the hard-coded value guid: 166c2589-3036-4683-be32-e7b2f6aeb324}
	body ->
			{
				"name": null,
				"description": "Charger located in Southerish parkinglog.",
				"status": "ACTIVE",
				"location": {"latitude": 38.8951, "longitude": -78.0364},
				"networkProtocol": "OCPP 1.6",
				"publicVisibility": true
			}

    // deletes a single charger by charger ID
    delete /chargers -> http://{public ip address}:3000/
	required headers -> 
		authorization : {use the hard-coded value guid: 166c2589-3036-4683-be32-e7b2f6aeb324}
	body ->
			{
				"id": 1
			}


useful notes:

SSH in (via putty)
-Download Putty
-Open Putty
-be sure to have downloaded the private key (simple-instance-2-key.ppk)
-open Putty, put in the private IP address in host
-add public key (simple-instance-2-key.ppk) in Connection\SSH\Auth\Credentials
	-click browse under "private key for authentication"

-Location of user-data log -> /var/log/user-data.log
 -Generating this log will require uncommenting the line "exec > >(tee /var/log/user-data.log) 2>&1"
 in DeloymentService/lib/user-data-script.sh

-Location of ChargerService logs -> /opt/ChargerService/logs
-When viewing logs use "cat": cat ChargerService_2024_03_27.log
This will allow for looking at large log entries (which can be copied else where for easier viewing)

//the service currently do not function
-locatoon of chargerservice.service -> /etc/systemd/system/chargerservice.service

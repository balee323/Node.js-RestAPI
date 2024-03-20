# ChargerService

Dependencies:
-Swagger


Steps to Deloy IoC:
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




Steps to Delete Deployed application:
-Using CMD Prompt or Shell
	-navigate to the deployment Project Directory
	-type "cdk destroy" to delete the deployment stack


Testing


#!/bin/bash

# Use this to install software packages
sudo yum install -y amazon-cloudwatch-agent
sudo amazon-cloudwatch-agent-ctl -a start

echo "Hello World"
sudo mkdir -p brianbrianbrian

sudo mkdir -p /opt/brianbrianbrian

# Read the first parameter into $PROJECT_ZIP
if [[ "$1" != "" ]]; then
    PROJECT_ZIP="$1"
else
    echo "No project to deploy."
    exit 1
fi

# Instance apps and dependencies.
sudo yum update -y
sudo yum groupinstall -y "Development Tools"

#install NVM and node
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
# set source
source ~/.bashrc
#install node latest
nvm install --lts


# Extract the project zip at desired location.
sudo mkdir -p /opt/ChargerService
sudo cp $PROJECT_ZIP /opt/ChargerService/ChargerService.zip
cd /opt/ChargerService
sudo unzip -o ChargerService.zip
#rm the-project.zip

# Install NPM modules and run app.js
# login as root
sudo su
#add servicegroup
sudo groupadd servicegroup
# give sericegroup root admin
sudo usermod -a -G servicegroup root
# add ec2-user to servicegroup
sudo usermod -a -G servicegroup ec2-user
#change directory permissions
sudo chgrp -R servicegroup ../ChargerService
sudo chmod -R 777 ../ChargerService
#change back to ec2-user
sudo su ec2-user
#run npm install
npm install

# finally run the app!!
node app.js
# Install NPM modules and run app.js
# login as root
sudo su
#add servicegroup
sudo groupadd servicegroup
# give sericegroup root admin
sudo usermod -a -G servicegroup root
# add ec2-user to servicegroup
sudo usermod -a -G servicegroup ec2-user
#change directory permissions
sudo chgrp -R servicegroup ../ChargerService
sudo chmod -R 777 ../ChargerService
#change back to ec2-user
sudo su ec2-user
#run npm install
npm install

# finally run the app!!
node app.js


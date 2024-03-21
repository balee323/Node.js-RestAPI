#!/bin/bash -xe

echo "Beginning setup and run of ChargerService API"

exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

# Use this to install software packages
sudo yum install -y amazon-cloudwatch-agent
sudo amazon-cloudwatch-agent-ctl -a start

echo "Setting passed parameter project zip name variable"
# Read the first parameter into $PROJECT_ZIP
if [[ "$1" != "" ]]; then
   PROJECT_ZIP="$1"
else
    echo "No project to deploy."
    sudo mkdir -p /opt/no_param
    exit 1
fi

echo "unzipping project files to /opt/ChargerService/"
# Extract the project zip at desired location.
sudo mkdir -p /opt/ChargerService
sudo cp $PROJECT_ZIP /opt/ChargerService/ChargerService.zip
cd /opt/ChargerService
sudo unzip -o ChargerService.zip

# Instance apps and dependencies.
sudo yum update -y
sudo yum groupinstall -y "Development Tools"

echo "installing NVM and Node"
# install NVM and node 
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
#install node latest
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install --lts

echo "Installing NPM modules"
# Install NPM modules and run app.js
# login as root
sudo su -c "$cmd_str"
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
sudo su ec2-user -c "$cmd_str"
#run npm install
npm install

echo "about to run the app"

# finally run the app!!
node app.js

echo "done"


#!/bin/bash

# Move the service file
echo "Moving the service file..."
rm -f /etc/systemd/system/redis-stack.service
mv ./redis-stack.service /etc/systemd/system/redis-stack.service

# Reload the systemctl daemon
echo "Reloading the systemctl daemon..."
sudo systemctl daemon-reload

# Enable the service
echo "Enabling the service..."
sudo systemctl enable redis-stack.service

# Start the service
echo "Starting the service..."
sudo systemctl start redis-stack.service

# Check the status
echo "Service status:"
sudo systemctl status redis-stack.service --no-pager --lines=10

# Configure the Redis Stack user and password in /etc/redis-stack.conf
USER_EXIST=$(grep -c '^user shrtct' /etc/redis-stack.conf)

if [ $USER_EXIST -eq 0 ]; then
  echo "Adding user with password to /etc/redis-stack.conf..."
  echo -e "
  user default off
  user shrtct on cvnoeWjdl53nvWEFJEKLFJEdf565grerFBBFBB +@all -@admin
  user default on vnklekjlejeeeJFEjflefjEFJlfe4jl342228 +@all
  " | sudo tee -a /etc/redis-stack.conf
else
  echo "User already exists in /etc/redis-stack.conf. Skipping..."
fi

# Restart the service to apply changes
echo "Restarting the service..."
sudo systemctl restart redis-stack.service

Vagrant.configure(2) do |config|
  
  config.vm.box = "hashicorp/precise64"

  config.vm.provision :shell, path: "v_bootstrap.sh"

  config.vm.network "forwarded_port", guest: 8080, host: 8080, auto_correct: true
  
  config.vm.synced_folder ".", "/rachio_api", create: true
  config.ssh.forward_agent = true
  
end
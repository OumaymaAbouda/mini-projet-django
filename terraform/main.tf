provider "aws" {
  region = "us-east-1"
}

# 1. Cluster
resource "aws_ecs_cluster" "nutritrack_cluster" {
  name = "nutritrack-cluster"
}

# 2. Récupération du réseau par défaut (indispensable pour Fargate)
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# 3. Groupe de Sécurité (Ouvre le port 8000)
resource "aws_security_group" "ecs_sg" {
  name_prefix = "nutritrack-sg-"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port   = 8000
    to_port     = 8000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# 4. Création du Service (On change le nom pour éviter l'erreur INACTIVE)
resource "aws_ecs_service" "nutritrack_service" {
  name            = "nutritrack-service-new"
  cluster         = aws_ecs_cluster.nutritrack_cluster.id
  task_definition = "nutritrack-task"
  launch_type     = "FARGATE"
  desired_count   = 1

  network_configuration {
    subnets          = data.aws_subnets.default.ids
    security_groups  = [aws_security_group.ecs_sg.id]
    assign_public_ip = true
  }

  lifecycle {
    ignore_changes = [task_definition]
  }
}
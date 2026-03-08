provider "aws" {
  region = "us-east-1"
}

# 1. On récupère le Cluster (déjà créé ou à créer)
resource "aws_ecs_cluster" "nutritrack_cluster" {
  name = "nutritrack-cluster"
}

# 2. On récupère le réseau par défaut d'AWS Academy
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# 3. On crée un groupe de sécurité pour ouvrir le port 8000
resource "aws_security_group" "ecs_sg" {
  name        = "nutritrack-ecs-sg"
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

# 4. On crée le Service ECS
resource "aws_ecs_service" "nutritrack_service" {
  name            = "nutritrack-service"
  cluster         = aws_ecs_cluster.nutritrack_cluster.id
  task_definition = "nutritrack-task" # Doit correspondre à la famille dans ton JSON
  launch_type     = "FARGATE"
  desired_count   = 1

  network_configuration {
    subnets          = data.aws_subnets.default.ids
    security_groups  = [aws_security_group.ecs_sg.id]
    assign_public_ip = true
  }

  # On ignore les changements manuels de la task definition car GitHub s'en occupe
  lifecycle {
    ignore_changes = [task_definition]
  }
}
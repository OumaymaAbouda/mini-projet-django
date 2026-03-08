provider "aws" {
  region = "us-east-1"
}

# On ne crée pas de VPC (trop complexe pour un lab), on utilise le réseau par défaut
resource "aws_ecs_cluster" "nutritrack_cluster" {
  name = "nutritrack-cluster"
}

# On ne crée PAS de rôle, on récupère le rôle existant du lab
data "aws_iam_role" "lab_role" {
  name = "LabRole"
}
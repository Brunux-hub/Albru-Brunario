-- MySQL dump 10.13  Distrib 8.0.43, for Linux (x86_64)
--
-- Host: localhost    Database: albru
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `albru`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `albru` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `albru`;

--
-- Table structure for table `asesores`
--

DROP TABLE IF EXISTS `asesores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `asesores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefono` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo` enum('asesor','gtr','validador','supervisor') COLLATE utf8mb4_unicode_ci DEFAULT 'asesor',
  `clientes_asignados` int DEFAULT '0',
  `estado` enum('activo','inactivo','suspendido') COLLATE utf8mb4_unicode_ci DEFAULT 'activo',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_asesores_tipo` (`tipo`),
  KEY `idx_asesores_estado` (`estado`),
  KEY `idx_asesores_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asesores`
--

LOCK TABLES `asesores` WRITE;
/*!40000 ALTER TABLE `asesores` DISABLE KEYS */;
INSERT INTO `asesores` VALUES (1,'María García','maria.garcia@albru.com','987654321','asesor',0,'activo','2025-10-13 21:34:54','2025-10-13 21:34:54'),(2,'Carlos López','carlos.lopez@albru.com','987654322','asesor',0,'activo','2025-10-13 21:34:54','2025-10-13 21:34:54'),(3,'Ana Torres','ana.torres@albru.com','987654323','gtr',0,'activo','2025-10-13 21:34:54','2025-10-13 21:34:54'),(4,'Luis Martín','luis.martin@albru.com','987654324','validador',0,'activo','2025-10-13 21:34:54','2025-10-13 21:34:54'),(5,'Sofia Rivera','sofia.rivera@albru.com','987654325','supervisor',0,'activo','2025-10-13 21:34:54','2025-10-13 21:34:54'),(6,'Diego Morales','diego.morales@albru.com','987654326','asesor',0,'activo','2025-10-13 21:34:54','2025-10-13 21:34:54'),(7,'Elena Castro','elena.castro@albru.com','987654327','asesor',0,'activo','2025-10-13 21:34:54','2025-10-13 21:34:54'),(8,'Roberto Silva','roberto.silva@albru.com','987654328','gtr',0,'activo','2025-10-13 21:34:54','2025-10-13 21:34:54');
/*!40000 ALTER TABLE `asesores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clientes`
--

DROP TABLE IF EXISTS `clientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clientes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lead_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dni` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `correo_electronico` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `direccion` text COLLATE utf8mb4_unicode_ci,
  `distrito` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `plan_seleccionado` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `precio_final` decimal(10,2) DEFAULT NULL,
  `estado_cliente` enum('nuevo','contactado','interesado','cotizado','vendido','perdido','seguimiento') COLLATE utf8mb4_unicode_ci DEFAULT 'nuevo',
  `asesor_asignado` int DEFAULT NULL,
  `observaciones_asesor` text COLLATE utf8mb4_unicode_ci,
  `fecha_asignacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_cita` timestamp NULL DEFAULT NULL,
  `numero_registro` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `numero_grabacion` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `numero_referencia` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo_documento` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `lugar_nacimiento` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `titular_linea` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `numero_piso` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `interior` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo_cliente` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dispositivos_adicionales` text COLLATE utf8mb4_unicode_ci,
  `pago_adelanto_instalacion` decimal(10,2) DEFAULT NULL,
  `plataforma_digital` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_programacion` timestamp NULL DEFAULT NULL,
  `fecha_instalacion` date DEFAULT NULL,
  `fecha_lead` timestamp NULL DEFAULT NULL,
  `score` int DEFAULT NULL,
  `coordenadas` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `campania` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `canal` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `comentarios_iniciales` text COLLATE utf8mb4_unicode_ci,
  `servicio` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `seguimiento` text COLLATE utf8mb4_unicode_ci,
  `gestion` text COLLATE utf8mb4_unicode_ci,
  `lead_score` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Score del lead del paso 1 (A, B, C, D)',
  `tipo_cliente_wizard` enum('nuevo','antiguo') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Tipo de cliente del wizard paso 1',
  `telefono_registro` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Teléfono de registro del paso 2',
  `dni_nombre_titular` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'DNI/Nombre titular línea telefónica',
  `parentesco_titular` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Parentesco con el titular de la línea',
  `telefono_referencia_wizard` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Teléfono de referencia del wizard',
  `telefono_grabacion_wizard` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Teléfono de grabación del wizard',
  `departamento` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Departamento (UBIGEO)',
  `direccion_completa` text COLLATE utf8mb4_unicode_ci COMMENT 'Dirección completa del paso 2',
  `numero_piso_wizard` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Número de piso del wizard',
  `tipo_plan` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Tipo de plan seleccionado',
  `servicio_contratado` text COLLATE utf8mb4_unicode_ci COMMENT 'Servicios contratados (lista separada por comas)',
  `velocidad_contratada` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Velocidad contratada',
  `precio_plan` decimal(10,2) DEFAULT NULL COMMENT 'Precio del plan',
  `dispositivos_adicionales_wizard` text COLLATE utf8mb4_unicode_ci COMMENT 'Dispositivos adicionales seleccionados',
  `plataforma_digital_wizard` text COLLATE utf8mb4_unicode_ci COMMENT 'Plataformas digitales seleccionadas',
  `pago_adelanto_instalacion_wizard` enum('SI','NO') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Pago adelanto instalación',
  `wizard_completado` tinyint(1) DEFAULT '0' COMMENT 'Indica si el wizard fue completado',
  `fecha_wizard_completado` timestamp NULL DEFAULT NULL COMMENT 'Fecha cuando se completó el wizard',
  `wizard_data_json` json DEFAULT NULL COMMENT 'Datos completos del wizard en formato JSON para respaldo',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `lead_id` (`lead_id`),
  KEY `idx_clientes_estado` (`estado_cliente`),
  KEY `idx_clientes_asesor` (`asesor_asignado`),
  KEY `idx_clientes_lead` (`lead_id`),
  KEY `idx_clientes_dni` (`dni`),
  KEY `idx_clientes_fecha` (`fecha_asignacion`),
  KEY `idx_clientes_wizard_completado` (`wizard_completado`),
  KEY `idx_clientes_tipo_cliente_wizard` (`tipo_cliente_wizard`),
  KEY `idx_clientes_departamento` (`departamento`),
  KEY `idx_clientes_distrito` (`distrito`),
  KEY `idx_clientes_lead_score` (`lead_score`),
  KEY `idx_clientes_tipo_plan` (`tipo_plan`),
  KEY `idx_clientes_fecha_wizard` (`fecha_wizard_completado`),
  CONSTRAINT `clientes_ibfk_1` FOREIGN KEY (`asesor_asignado`) REFERENCES `asesores` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clientes`
--

LOCK TABLES `clientes` WRITE;
/*!40000 ALTER TABLE `clientes` DISABLE KEYS */;
/*!40000 ALTER TABLE `clientes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `historial_cliente`
--

DROP TABLE IF EXISTS `historial_cliente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `historial_cliente` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cliente_id` int NOT NULL,
  `usuario_id` int DEFAULT NULL,
  `accion` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado_anterior` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado_nuevo` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `comentarios` text COLLATE utf8mb4_unicode_ci,
  `fecha_accion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_historial_cliente` (`cliente_id`),
  KEY `idx_historial_usuario` (`usuario_id`),
  KEY `idx_historial_fecha` (`fecha_accion`),
  CONSTRAINT `historial_cliente_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `historial_cliente_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios_sistema` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historial_cliente`
--

LOCK TABLES `historial_cliente` WRITE;
/*!40000 ALTER TABLE `historial_cliente` DISABLE KEYS */;
/*!40000 ALTER TABLE `historial_cliente` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios_sistema`
--

DROP TABLE IF EXISTS `usuarios_sistema`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios_sistema` (
  `id` int NOT NULL AUTO_INCREMENT,
  `asesor_id` int DEFAULT NULL,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('admin','gtr','asesor','supervisor','validaciones') COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado_acceso` enum('pendiente','activo','suspendido') COLLATE utf8mb4_unicode_ci DEFAULT 'pendiente',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `ultimo_login` timestamp NULL DEFAULT NULL,
  `creado_por` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `asesor_id` (`asesor_id`),
  KEY `creado_por` (`creado_por`),
  KEY `idx_usuarios_role` (`role`),
  KEY `idx_usuarios_estado` (`estado_acceso`),
  KEY `idx_usuarios_login` (`ultimo_login`),
  CONSTRAINT `usuarios_sistema_ibfk_1` FOREIGN KEY (`asesor_id`) REFERENCES `asesores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `usuarios_sistema_ibfk_2` FOREIGN KEY (`creado_por`) REFERENCES `usuarios_sistema` (`id`) ON DELETE SET NULL,
  CONSTRAINT `usuarios_sistema_chk_1` CHECK ((`role` in (_utf8mb4'admin',_utf8mb4'gtr',_utf8mb4'asesor',_utf8mb4'supervisor',_utf8mb4'validaciones'))),
  CONSTRAINT `usuarios_sistema_chk_2` CHECK ((`estado_acceso` in (_utf8mb4'pendiente',_utf8mb4'activo',_utf8mb4'suspendido')))
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios_sistema`
--

LOCK TABLES `usuarios_sistema` WRITE;
/*!40000 ALTER TABLE `usuarios_sistema` DISABLE KEYS */;
INSERT INTO `usuarios_sistema` VALUES (1,NULL,'admin','$2b$10$XGKmkJlWXJmKVl5qGUVHPO3vU6M3BF5F3I3GrOzHCW3IQGGQNGbMm','admin','activo','2025-10-13 21:34:54',NULL,NULL),(2,1,'maria.garcia','$2b$10$XGKmkJlWXJmKVl5qGUVHPO3vU6M3BF5F3I3GrOzHCW3IQGGQNGbMm','asesor','activo','2025-10-13 21:34:54',NULL,1),(3,2,'carlos.lopez','$2b$10$XGKmkJlWXJmKVl5qGUVHPO3vU6M3BF5F3I3GrOzHCW3IQGGQNGbMm','asesor','activo','2025-10-13 21:34:54',NULL,1),(4,3,'ana.torres','$2b$10$XGKmkJlWXJmKVl5qGUVHPO3vU6M3BF5F3I3GrOzHCW3IQGGQNGbMm','gtr','activo','2025-10-13 21:34:54',NULL,1),(5,4,'luis.martin','$2b$10$XGKmkJlWXJmKVl5qGUVHPO3vU6M3BF5F3I3GrOzHCW3IQGGQNGbMm','validaciones','activo','2025-10-13 21:34:54',NULL,1),(6,5,'sofia.rivera','$2b$10$XGKmkJlWXJmKVl5qGUVHPO3vU6M3BF5F3I3GrOzHCW3IQGGQNGbMm','supervisor','activo','2025-10-13 21:34:54',NULL,1),(7,6,'diego.morales','$2b$10$XGKmkJlWXJmKVl5qGUVHPO3vU6M3BF5F3I3GrOzHCW3IQGGQNGbMm','asesor','activo','2025-10-13 21:34:54',NULL,1),(8,7,'elena.castro','$2b$10$XGKmkJlWXJmKVl5qGUVHPO3vU6M3BF5F3I3GrOzHCW3IQGGQNGbMm','asesor','activo','2025-10-13 21:34:54',NULL,1),(9,8,'roberto.silva','$2b$10$XGKmkJlWXJmKVl5qGUVHPO3vU6M3BF5F3I3GrOzHCW3IQGGQNGbMm','gtr','activo','2025-10-13 21:34:54',NULL,1);
/*!40000 ALTER TABLE `usuarios_sistema` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `validaciones`
--

DROP TABLE IF EXISTS `validaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `validaciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cliente_id` int DEFAULT NULL,
  `validador_id` int DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'pendiente',
  `fecha_programacion` timestamp NULL DEFAULT NULL,
  `fecha_instalacion` date DEFAULT NULL,
  `resultado` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `motivo_rechazo` text COLLATE utf8mb4_unicode_ci,
  `comentario_validador` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_validaciones_status` (`status`),
  KEY `idx_validaciones_cliente` (`cliente_id`),
  KEY `idx_validaciones_validador` (`validador_id`),
  KEY `idx_validaciones_fecha` (`fecha_programacion`),
  CONSTRAINT `validaciones_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `validaciones_ibfk_2` FOREIGN KEY (`validador_id`) REFERENCES `asesores` (`id`) ON DELETE SET NULL,
  CONSTRAINT `validaciones_chk_1` CHECK ((`status` in (_utf8mb4'pendiente',_utf8mb4'en_revision',_utf8mb4'validado',_utf8mb4'rechazado')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `validaciones`
--

LOCK TABLES `validaciones` WRITE;
/*!40000 ALTER TABLE `validaciones` DISABLE KEYS */;
/*!40000 ALTER TABLE `validaciones` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-13 21:36:31

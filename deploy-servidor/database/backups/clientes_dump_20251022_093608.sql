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
-- Table structure for table `clientes`
--

DROP TABLE IF EXISTS `clientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clientes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo_base` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `leads_original_telefono` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `campana` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `canal_adquisicion` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sala_asignada` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `compania` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `back_office_info` text COLLATE utf8mb4_unicode_ci,
  `tipificacion_back` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `datos_leads` json DEFAULT NULL,
  `comentarios_back` text COLLATE utf8mb4_unicode_ci,
  `ultima_fecha_gestion` datetime DEFAULT NULL,
  `telefono` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_ultimo_contacto` datetime DEFAULT NULL,
  `notas` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `tipo_cliente_wizard` enum('nuevo','antiguo') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lead_score` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono_registro` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `dni_nombre_titular` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `parentesco_titular` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono_referencia_wizard` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono_grabacion_wizard` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `direccion_completa` text COLLATE utf8mb4_unicode_ci,
  `numero_piso_wizard` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo_plan` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `servicio_contratado` text COLLATE utf8mb4_unicode_ci,
  `velocidad_contratada` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `precio_plan` decimal(10,2) DEFAULT NULL,
  `dispositivos_adicionales_wizard` text COLLATE utf8mb4_unicode_ci,
  `plataforma_digital_wizard` text COLLATE utf8mb4_unicode_ci,
  `pago_adelanto_instalacion_wizard` enum('SI','NO') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `wizard_completado` tinyint(1) DEFAULT '0',
  `fecha_wizard_completado` timestamp NULL DEFAULT NULL,
  `wizard_data_json` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_telefono` (`telefono`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clientes`
--

LOCK TABLES `clientes` WRITE;
/*!40000 ALTER TABLE `clientes` DISABLE KEYS */;
/*!40000 ALTER TABLE `clientes` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-22 14:36:12

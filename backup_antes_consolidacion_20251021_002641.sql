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
-- Table structure for table `administradores`
--

DROP TABLE IF EXISTS `administradores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `administradores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `permisos_especiales` json DEFAULT NULL,
  `nivel_acceso` enum('super_admin','admin','admin_limitado') COLLATE utf8mb4_unicode_ci DEFAULT 'admin',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `idx_nivel_acceso` (`nivel_acceso`),
  CONSTRAINT `administradores_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `administradores`
--

LOCK TABLES `administradores` WRITE;
/*!40000 ALTER TABLE `administradores` DISABLE KEYS */;
INSERT INTO `administradores` VALUES (1,1,'{\"full_access\": true, \"system_config\": true, \"user_management\": true}','super_admin','2025-10-13 22:30:31','2025-10-13 22:30:31');
/*!40000 ALTER TABLE `administradores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `asesores`
--

DROP TABLE IF EXISTS `asesores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `asesores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `gtr_asignado` int DEFAULT NULL,
  `clientes_asignados` int DEFAULT '0',
  `meta_mensual` decimal(10,2) DEFAULT '0.00',
  `ventas_realizadas` decimal(10,2) DEFAULT '0.00',
  `comision_porcentaje` decimal(5,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `idx_gtr_asignado` (`gtr_asignado`),
  KEY `idx_clientes_asignados` (`clientes_asignados`),
  CONSTRAINT `asesores_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `asesores_ibfk_2` FOREIGN KEY (`gtr_asignado`) REFERENCES `gtr` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asesores`
--

LOCK TABLES `asesores` WRITE;
/*!40000 ALTER TABLE `asesores` DISABLE KEYS */;
INSERT INTO `asesores` VALUES (1,3,1,3,50000.00,0.00,5.00,'2025-10-13 22:30:31','2025-10-16 21:01:32'),(3,1,1,0,50000.00,0.00,5.00,'2025-10-17 21:31:24','2025-10-17 21:31:24'),(4,2,1,0,50000.00,0.00,5.00,'2025-10-17 21:31:24','2025-10-17 21:31:24'),(5,4,1,0,50000.00,0.00,5.00,'2025-10-17 21:31:24','2025-10-17 21:31:24'),(6,5,1,0,50000.00,0.00,5.00,'2025-10-17 21:31:24','2025-10-17 21:31:24'),(7,7,1,0,50000.00,0.00,5.00,'2025-10-17 21:31:24','2025-10-17 21:31:24'),(8,8,1,0,50000.00,0.00,5.00,'2025-10-17 21:31:24','2025-10-17 23:58:52'),(9,9,1,0,50000.00,0.00,5.00,'2025-10-17 21:31:24','2025-10-17 21:31:24'),(10,10,1,1,50000.00,0.00,5.00,'2025-10-17 21:31:24','2025-10-17 23:58:52'),(11,11,1,0,50000.00,0.00,5.00,'2025-10-17 21:31:24','2025-10-17 21:31:24'),(12,12,1,0,50000.00,0.00,5.00,'2025-10-17 21:31:24','2025-10-17 21:31:24'),(13,14,1,0,50000.00,0.00,5.00,'2025-10-17 21:31:24','2025-10-17 21:31:24'),(14,17,1,0,50000.00,0.00,5.00,'2025-10-17 21:31:24','2025-10-17 21:31:24');
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
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `apellidos` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dni` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `edad` int DEFAULT NULL,
  `genero` enum('masculino','femenino','otro') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado_civil` enum('soltero','casado','divorciado','viudo','union_libre') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ocupacion` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ingresos_mensuales` decimal(10,2) DEFAULT NULL,
  `dependientes_economicos` int DEFAULT '0',
  `direccion` text COLLATE utf8mb4_unicode_ci,
  `ciudad` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `horario_preferido_contacto` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `medio_contacto_preferido` enum('telefono','whatsapp','email','presencial') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `asesor_asignado` int DEFAULT NULL,
  `estado` enum('nuevo','contactado','interesado','propuesta_enviada','cerrado','perdido') COLLATE utf8mb4_unicode_ci DEFAULT 'nuevo',
  `prioridad` enum('baja','media','alta','urgente') COLLATE utf8mb4_unicode_ci DEFAULT 'media',
  `fecha_primer_contacto` datetime DEFAULT NULL,
  `fecha_ultimo_contacto` datetime DEFAULT NULL,
  `fecha_cierre_estimada` date DEFAULT NULL,
  `notas` text COLLATE utf8mb4_unicode_ci,
  `observaciones_asesor` text COLLATE utf8mb4_unicode_ci,
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
  KEY `idx_asesor_asignado` (`asesor_asignado`),
  KEY `idx_estado` (`estado`),
  KEY `idx_prioridad` (`prioridad`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `clientes_asesor_fk` FOREIGN KEY (`asesor_asignado`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clientes`
--

LOCK TABLES `clientes` WRITE;
/*!40000 ALTER TABLE `clientes` DISABLE KEYS */;
INSERT INTO `clientes` VALUES (9,NULL,NULL,'+51999999999',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,10,'nuevo','media',NULL,NULL,NULL,NULL,NULL,'2025-10-17 23:22:20','2025-10-17 23:58:52',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL);
/*!40000 ALTER TABLE `clientes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clientes_backup_campos_eliminados`
--

DROP TABLE IF EXISTS `clientes_backup_campos_eliminados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clientes_backup_campos_eliminados` (
  `id` int NOT NULL DEFAULT '0',
  `ingresos_adicionales` decimal(10,2) DEFAULT NULL,
  `gastos_mensuales` decimal(10,2) DEFAULT NULL,
  `banco_principal` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo_cuenta` enum('ahorros','corriente','nomina') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `codigo_postal` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `departamento` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tiene_seguros_actuales` tinyint(1) DEFAULT '0',
  `seguros_actuales` text COLLATE utf8mb4_unicode_ci,
  `monto_asegurado_deseado` decimal(12,2) DEFAULT NULL,
  `tipo_seguro_interes` enum('vida','salud','vehicular','hogar','empresarial') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono_alternativo` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lugar_nacimiento` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clientes_backup_campos_eliminados`
--

LOCK TABLES `clientes_backup_campos_eliminados` WRITE;
/*!40000 ALTER TABLE `clientes_backup_campos_eliminados` DISABLE KEYS */;
INSERT INTO `clientes_backup_campos_eliminados` VALUES (2,NULL,NULL,NULL,NULL,NULL,'Lima',0,NULL,75000.00,'vida',NULL,NULL),(3,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL),(4,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL),(5,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,'Lima'),(6,NULL,NULL,NULL,NULL,NULL,'13',0,NULL,NULL,NULL,NULL,'Huancavelica'),(7,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `clientes_backup_campos_eliminados` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gtr`
--

DROP TABLE IF EXISTS `gtr`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gtr` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `asesores_a_cargo` int DEFAULT '0',
  `region` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `idx_region` (`region`),
  CONSTRAINT `gtr_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gtr`
--

LOCK TABLES `gtr` WRITE;
/*!40000 ALTER TABLE `gtr` DISABLE KEYS */;
INSERT INTO `gtr` VALUES (1,2,1,'Lima','2025-10-13 22:30:31','2025-10-13 22:30:31');
/*!40000 ALTER TABLE `gtr` ENABLE KEYS */;
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
  `usuario_id` int NOT NULL,
  `accion` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `estado_anterior` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado_nuevo` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cliente_id` (`cliente_id`),
  KEY `idx_usuario_id` (`usuario_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `historial_cliente_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `historial_cliente_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historial_cliente`
--

LOCK TABLES `historial_cliente` WRITE;
/*!40000 ALTER TABLE `historial_cliente` DISABLE KEYS */;
INSERT INTO `historial_cliente` VALUES (10,9,2,'reasignado_asesor','Cliente reasignado por GTR desde panel de gestión',NULL,'nuevo','2025-10-17 23:22:55'),(11,9,2,'reasignado_asesor','Cliente reasignado por GTR desde panel de gestión',NULL,'nuevo','2025-10-17 23:58:52');
/*!40000 ALTER TABLE `historial_cliente` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `supervisores`
--

DROP TABLE IF EXISTS `supervisores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `supervisores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `area_supervision` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `asesores_supervisados` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `idx_area` (`area_supervision`),
  CONSTRAINT `supervisores_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supervisores`
--

LOCK TABLES `supervisores` WRITE;
/*!40000 ALTER TABLE `supervisores` DISABLE KEYS */;
INSERT INTO `supervisores` VALUES (1,4,'Ventas',0,'2025-10-13 22:30:31','2025-10-13 22:30:31');
/*!40000 ALTER TABLE `supervisores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefono` int DEFAULT NULL,
  `tipo` enum('admin','gtr','asesor','supervisor','validador') COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` enum('activo','inactivo','suspendido') COLLATE utf8mb4_unicode_ci DEFAULT 'activo',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `theme_primary` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT '#1976d2',
  `theme_secondary` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT '#dc004e',
  `theme_accent` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT '#42a5f5',
  `theme_background` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT '#f5f5f5',
  `theme_surface` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT '#ffffff',
  `brand_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logo_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `permissions` json DEFAULT NULL,
  `dashboard_path` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_tipo` (`tipo`),
  KEY `idx_estado` (`estado`),
  KEY `idx_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'JEYSON ALDHAIR VENANCIO OBREGON','jvenancioo@albru.pe','$2b$10$NncKofdV.PXoX2Cpm0iZ0u/DvqCEfdgnnLi3Ehyz1lZVLUtbPZYkG',922004371,'asesor','activo','2025-10-13 22:30:31','2025-10-18 00:17:31','#2196f3','#ff9800','#64b5f6','#e3f2fd','#ffffff','Jeyson Venancio - Asesor','/assets/logo-jvenancioo.png','[\"view_clients\", \"edit_clients\", \"create_clients\", \"wizard_access\"]','/dashboard/asesor'),(2,'ANDREA YANEL CATALAN MAYTA','acatalanm@albru.pe','$2b$10$NncKofdV.PXoX2Cpm0iZ0u/DvqCEfdgnnLi3Ehyz1lZVLUtbPZYkG',927392745,'asesor','activo','2025-10-13 22:30:31','2025-10-20 07:16:57','#e91e63','#9c27b0','#f48fb1','#fce4ec','#ffffff','Andrea CatalÃ¡n - Asesor','/assets/logo-acatalanm.png','[\"view_clients\", \"edit_clients\", \"create_clients\", \"wizard_access\"]','/dashboard/asesor'),(3,'ANGELO FEBEAN DIAZ CHANCAFE','adiazc@albru.pe','$2b$10$NncKofdV.PXoX2Cpm0iZ0u/DvqCEfdgnnLi3Ehyz1lZVLUtbPZYkG',933699045,'asesor','activo','2025-10-13 22:30:31','2025-10-18 00:12:05','#4caf50','#ff5722','#81c784','#e8f5e8','#ffffff','Angelo DÃ­az - Asesor','/assets/logo-adiazc.png','[\"view_clients\", \"edit_clients\", \"create_clients\", \"wizard_access\"]','/dashboard/asesor'),(4,'CRISTHIAN DIEGO MACEDO LEYVA','cmacedol@albru.pe','$2b$10$NncKofdV.PXoX2Cpm0iZ0u/DvqCEfdgnnLi3Ehyz1lZVLUtbPZYkG',968286531,'asesor','activo','2025-10-13 22:30:31','2025-10-18 00:12:05','#ff9800','#3f51b5','#ffb74d','#fff3e0','#ffffff','Cristhian Macedo - Asesor','/assets/logo-cmacedol.png','[\"view_clients\", \"edit_clients\", \"create_clients\", \"wizard_access\"]','/dashboard/asesor'),(5,'DARYL ESTEFANO SÁNCHEZ CÁCERES','dsanchezc@albru.pe','$2b$10$NncKofdV.PXoX2Cpm0iZ0u/DvqCEfdgnnLi3Ehyz1lZVLUtbPZYkG',920096150,'asesor','activo','2025-10-13 22:30:31','2025-10-18 00:12:05','#795548','#607d8b','#a1887f','#efebe9','#ffffff','Daryl SÃ¡nchez - Asesor','/assets/logo-dsanchezc.png','[\"view_clients\", \"edit_clients\", \"create_clients\", \"wizard_access\"]','/dashboard/asesor'),(6,'REILEX GABRIEL RAMIREZ TOVAR','rramirezt@albru.pe','$2b$10$NncKofdV.PXoX2Cpm0iZ0u/DvqCEfdgnnLi3Ehyz1lZVLUtbPZYkG',922055254,'supervisor','activo','2025-10-16 19:58:23','2025-10-18 00:12:05','#ff9800','#2196f3','#ffb74d','#fff3e0','#ffffff','Reilex Ramirez - Supervisor','/assets/logo-rramirezt.png','[\"view_all_clients\", \"view_reports\", \"monitor_asesores\", \"manage_team\"]','/dashboard/supervisor'),(7,'GINGER STEPHANY CABRERA NIZAMA','gcabreran@albru.pe','$2b$10$NncKofdV.PXoX2Cpm0iZ0u/DvqCEfdgnnLi3Ehyz1lZVLUtbPZYkG',912964147,'asesor','activo','2025-10-16 19:58:23','2025-10-18 00:12:05','#3f51b5','#4caf50','#7986cb','#e8eaf6','#ffffff','GINGER STEPHANY - Asesor','/assets/logo-gcabreran.png','[\"view_clients\", \"edit_clients\", \"create_clients\", \"wizard_access\"]','/dashboard/asesor'),(8,'JESSICA DIANA MEZA VELASQUEZ','jmezav@albru.pe','$2b$10$NncKofdV.PXoX2Cpm0iZ0u/DvqCEfdgnnLi3Ehyz1lZVLUtbPZYkG',922255453,'asesor','activo','2025-10-16 19:58:23','2025-10-18 00:12:05','#3f51b5','#4caf50','#7986cb','#e8eaf6','#ffffff','JESSICA DIANA - Asesor','/assets/logo-jmezav.png','[\"view_clients\", \"edit_clients\", \"create_clients\", \"wizard_access\"]','/dashboard/asesor'),(9,'JHUDIT ARIAS ROJAS','jariasr@albru.pe','$2b$10$NncKofdV.PXoX2Cpm0iZ0u/DvqCEfdgnnLi3Ehyz1lZVLUtbPZYkG',988673606,'asesor','activo','2025-10-16 19:58:23','2025-10-18 00:12:05','#3f51b5','#4caf50','#7986cb','#e8eaf6','#ffffff','JHUDIT ARIAS - Asesor','/assets/logo-jariasr.png','[\"view_clients\", \"edit_clients\", \"create_clients\", \"wizard_access\"]','/dashboard/asesor'),(10,'JUAN PABLO CLEMENT CLEMENT','jclementc@albru.pe','$2b$10$NncKofdV.PXoX2Cpm0iZ0u/DvqCEfdgnnLi3Ehyz1lZVLUtbPZYkG',950190431,'asesor','activo','2025-10-16 19:58:23','2025-10-18 00:12:05','#3f51b5','#4caf50','#7986cb','#e8eaf6','#ffffff','JUAN PABLO - Asesor','/assets/logo-jclementc.png','[\"view_clients\", \"edit_clients\", \"create_clients\", \"wizard_access\"]','/dashboard/asesor'),(11,'KAREN GUISELL RIVERA BALDEON','kriverab@albru.pe','$2b$10$NncKofdV.PXoX2Cpm0iZ0u/DvqCEfdgnnLi3Ehyz1lZVLUtbPZYkG',953945204,'asesor','activo','2025-10-16 19:58:23','2025-10-18 00:12:05','#3f51b5','#4caf50','#7986cb','#e8eaf6','#ffffff','KAREN GUISELL - Asesor','/assets/logo-kriverab.png','[\"view_clients\", \"edit_clients\", \"create_clients\", \"wizard_access\"]','/dashboard/asesor'),(12,'LUCIA PAREDES CASAMAYOR','lparedesc@albru.pe','$2b$10$NncKofdV.PXoX2Cpm0iZ0u/DvqCEfdgnnLi3Ehyz1lZVLUtbPZYkG',921752266,'asesor','activo','2025-10-16 19:58:23','2025-10-18 00:12:05','#3f51b5','#4caf50','#7986cb','#e8eaf6','#ffffff','LUCIA PAREDES - Asesor','/assets/logo-lparedesc.png','[\"view_clients\", \"edit_clients\", \"create_clients\", \"wizard_access\"]','/dashboard/asesor'),(13,'MATIAS JOSUÉ CÁCERES VASQUEZ','mcaceresv@albru.pe','$2b$10$NncKofdV.PXoX2Cpm0iZ0u/DvqCEfdgnnLi3Ehyz1lZVLUtbPZYkG',967098495,'gtr','activo','2025-10-16 19:58:23','2025-10-20 05:48:08','#009688','#ff5722','#4db6ac','#e0f2f1','#ffffff','Matias CÃ¡ceres - GTR','/assets/logo-mcaceresv.png','[\"view_all_clients\", \"assign_clients\", \"view_asesores\", \"manage_assignments\"]','/dashboard/gtr'),(14,'KIARA MIA VIVANCO ALVA','kvivancoa@albru.pe','$2b$10$NncKofdV.PXoX2Cpm0iZ0u/DvqCEfdgnnLi3Ehyz1lZVLUtbPZYkG',925527658,'asesor','activo','2025-10-16 19:58:23','2025-10-18 00:12:05','#3f51b5','#4caf50','#7986cb','#e8eaf6','#ffffff','KIARA MIA - Asesor','/assets/logo-kvivancoa.png','[\"view_clients\", \"edit_clients\", \"create_clients\", \"wizard_access\"]','/dashboard/asesor'),(15,'NAYELI AMELUZ PALACIOS SIMBALA','npalacioss@albru.pe','$2b$10$NncKofdV.PXoX2Cpm0iZ0u/DvqCEfdgnnLi3Ehyz1lZVLUtbPZYkG',966306637,'validador','activo','2025-10-16 19:58:23','2025-10-18 00:12:05','#673ab7','#e91e63','#9575cd','#ede7f6','#ffffff','NAYELI AMELUZ - Validador','/assets/logo-npalacioss.png','[\"view_validations\", \"process_validations\", \"approve_documents\"]','/dashboard/validaciones'),(16,'ROXANA GISELA VILLAR BAZAN','rvillarb@albru.pe','$2b$10$NncKofdV.PXoX2Cpm0iZ0u/DvqCEfdgnnLi3Ehyz1lZVLUtbPZYkG',930568869,'validador','activo','2025-10-16 19:58:23','2025-10-18 00:12:05','#673ab7','#e91e63','#9575cd','#ede7f6','#ffffff','ROXANA GISELA - Validador','/assets/logo-rvillarb.png','[\"view_validations\", \"process_validations\", \"approve_documents\"]','/dashboard/validaciones'),(17,'SEBASTIAN ALESSANDRO BATISTA LIZARBE ACASIETE','sbatistal@albru.pe','$2b$10$NncKofdV.PXoX2Cpm0iZ0u/DvqCEfdgnnLi3Ehyz1lZVLUtbPZYkG',927854566,'asesor','activo','2025-10-16 19:58:23','2025-10-18 00:12:05','#3f51b5','#4caf50','#7986cb','#e8eaf6','#ffffff','SEBASTIAN ALESSANDRO - Asesor','/assets/logo-sbatistal.png','[\"view_clients\", \"edit_clients\", \"create_clients\", \"wizard_access\"]','/dashboard/asesor');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios_sistema`
--

DROP TABLE IF EXISTS `usuarios_sistema`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios_sistema` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `usuario_id` int NOT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `ultimo_acceso` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `usuario_id` (`usuario_id`),
  KEY `idx_username` (`username`),
  KEY `idx_activo` (`activo`),
  CONSTRAINT `usuarios_sistema_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios_sistema`
--

LOCK TABLES `usuarios_sistema` WRITE;
/*!40000 ALTER TABLE `usuarios_sistema` DISABLE KEYS */;
INSERT INTO `usuarios_sistema` VALUES (1,'jvenancioo','60946625',1,1,NULL,NULL,NULL),(2,'acatalanm','71249673',2,1,NULL,NULL,NULL),(3,'adiazc','70478547',3,1,NULL,NULL,NULL),(4,'cmacedol','72232415',4,1,NULL,NULL,NULL),(5,'dsanchezc','71662399',5,1,NULL,NULL,NULL),(6,'rramirezt','6138315',6,1,NULL,NULL,NULL),(7,'gcabreran','72540275',7,1,NULL,NULL,NULL),(8,'jmezav','73500150',8,1,NULL,NULL,NULL),(9,'jariasr','77143843',9,1,NULL,NULL,NULL),(10,'jclementc','76122260',10,1,NULL,NULL,NULL),(11,'kriverab','76211912',11,1,NULL,NULL,NULL),(12,'lparedesc','77421711',12,1,NULL,NULL,NULL),(13,'mcaceresv','70779032',13,1,NULL,NULL,NULL),(14,'kvivancoa','74000970',14,1,NULL,NULL,NULL),(15,'npalacioss','73666105',15,1,NULL,NULL,NULL),(16,'rvillarb','44647864',16,1,NULL,NULL,NULL),(17,'sbatistal','60854262',17,1,NULL,NULL,NULL);
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
  `cliente_id` int NOT NULL,
  `validador_id` int NOT NULL,
  `tipo_validacion` enum('calidad','documentos','ventas','general') COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` enum('pendiente','aprobado','rechazado','revision') COLLATE utf8mb4_unicode_ci DEFAULT 'pendiente',
  `observaciones` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cliente_id` (`cliente_id`),
  KEY `idx_validador_id` (`validador_id`),
  KEY `idx_estado` (`estado`),
  KEY `idx_tipo` (`tipo_validacion`),
  CONSTRAINT `validaciones_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `validaciones_ibfk_2` FOREIGN KEY (`validador_id`) REFERENCES `validadores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `validaciones`
--

LOCK TABLES `validaciones` WRITE;
/*!40000 ALTER TABLE `validaciones` DISABLE KEYS */;
/*!40000 ALTER TABLE `validaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `validadores`
--

DROP TABLE IF EXISTS `validadores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `validadores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `tipo_validacion` enum('calidad','documentos','ventas','general') COLLATE utf8mb4_unicode_ci DEFAULT 'general',
  `validaciones_realizadas` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `idx_tipo_validacion` (`tipo_validacion`),
  CONSTRAINT `validadores_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `validadores`
--

LOCK TABLES `validadores` WRITE;
/*!40000 ALTER TABLE `validadores` DISABLE KEYS */;
INSERT INTO `validadores` VALUES (1,5,'calidad',0,'2025-10-13 22:30:31','2025-10-13 22:30:31');
/*!40000 ALTER TABLE `validadores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `vista_asesores_completos`
--

DROP TABLE IF EXISTS `vista_asesores_completos`;
/*!50001 DROP VIEW IF EXISTS `vista_asesores_completos`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vista_asesores_completos` AS SELECT 
 1 AS `asesor_id`,
 1 AS `usuario_id`,
 1 AS `nombre`,
 1 AS `email`,
 1 AS `telefono`,
 1 AS `estado`,
 1 AS `clientes_asignados`,
 1 AS `meta_mensual`,
 1 AS `ventas_realizadas`,
 1 AS `comision_porcentaje`,
 1 AS `gtr_nombre`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `vista_usuarios_completos`
--

DROP TABLE IF EXISTS `vista_usuarios_completos`;
/*!50001 DROP VIEW IF EXISTS `vista_usuarios_completos`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vista_usuarios_completos` AS SELECT 
 1 AS `id`,
 1 AS `nombre`,
 1 AS `email`,
 1 AS `telefono`,
 1 AS `tipo`,
 1 AS `estado`,
 1 AS `created_at`,
 1 AS `detalle_rol`*/;
SET character_set_client = @saved_cs_client;

--
-- Final view structure for view `vista_asesores_completos`
--

/*!50001 DROP VIEW IF EXISTS `vista_asesores_completos`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = latin1 */;
/*!50001 SET character_set_results     = latin1 */;
/*!50001 SET collation_connection      = latin1_swedish_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vista_asesores_completos` AS select `a`.`id` AS `asesor_id`,`u`.`id` AS `usuario_id`,`u`.`nombre` AS `nombre`,`u`.`email` AS `email`,`u`.`telefono` AS `telefono`,`u`.`estado` AS `estado`,`a`.`clientes_asignados` AS `clientes_asignados`,`a`.`meta_mensual` AS `meta_mensual`,`a`.`ventas_realizadas` AS `ventas_realizadas`,`a`.`comision_porcentaje` AS `comision_porcentaje`,`g`.`nombre` AS `gtr_nombre` from (((`asesores` `a` join `usuarios` `u` on((`a`.`usuario_id` = `u`.`id`))) left join `gtr` `gt` on((`a`.`gtr_asignado` = `gt`.`id`))) left join `usuarios` `g` on((`gt`.`usuario_id` = `g`.`id`))) where (`u`.`estado` = 'activo') */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `vista_usuarios_completos`
--

/*!50001 DROP VIEW IF EXISTS `vista_usuarios_completos`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = latin1 */;
/*!50001 SET character_set_results     = latin1 */;
/*!50001 SET collation_connection      = latin1_swedish_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vista_usuarios_completos` AS select `u`.`id` AS `id`,`u`.`nombre` AS `nombre`,`u`.`email` AS `email`,`u`.`telefono` AS `telefono`,`u`.`tipo` AS `tipo`,`u`.`estado` AS `estado`,`u`.`created_at` AS `created_at`,(case when (`u`.`tipo` = 'admin') then `a`.`nivel_acceso` when (`u`.`tipo` = 'gtr') then `g`.`region` when (`u`.`tipo` = 'asesor') then convert(concat('Meta: ',`ases`.`meta_mensual`) using utf8mb4) when (`u`.`tipo` = 'supervisor') then `s`.`area_supervision` when (`u`.`tipo` = 'validador') then `v`.`tipo_validacion` else NULL end) AS `detalle_rol` from (((((`usuarios` `u` left join `administradores` `a` on((`u`.`id` = `a`.`usuario_id`))) left join `gtr` `g` on((`u`.`id` = `g`.`usuario_id`))) left join `asesores` `ases` on((`u`.`id` = `ases`.`usuario_id`))) left join `supervisores` `s` on((`u`.`id` = `s`.`usuario_id`))) left join `validadores` `v` on((`u`.`id` = `v`.`usuario_id`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-21  5:26:41

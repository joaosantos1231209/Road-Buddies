-- MySQL dump 10.13  Distrib 8.4.10, for Linux (x86_64)
--
-- Host: localhost    Database: rode_buddies
-- ------------------------------------------------------
-- Server version	8.4.10

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
-- Table structure for table `chat_reads`
--

DROP TABLE IF EXISTS `chat_reads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_reads` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(128) NOT NULL,
  `trip_id` int NOT NULL,
  `last_read_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `chat_reads_trip_id_trips_id_fk` (`trip_id`),
  KEY `chat_reads_user_trip_idx` (`user_id`,`trip_id`),
  CONSTRAINT `chat_reads_trip_id_trips_id_fk` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chat_reads_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_reads`
--

LOCK TABLES `chat_reads` WRITE;
/*!40000 ALTER TABLE `chat_reads` DISABLE KEYS */;
INSERT INTO `chat_reads` VALUES (4,'6mjKnLQ445Tqr4yeIt87QbabGiv2',131,'2026-06-24 12:10:45'),(5,'7VVPVl93L4VITRfdT0On6mrtVPp2',131,'2026-06-24 12:10:45'),(6,'7VVPVl93L4VITRfdT0On6mrtVPp2',131,'2026-06-24 12:10:45');
/*!40000 ALTER TABLE `chat_reads` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cities`
--

DROP TABLE IF EXISTS `cities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cities` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `is_office` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `cities_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=352 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cities`
--

LOCK TABLES `cities` WRITE;
/*!40000 ALTER TABLE `cities` DISABLE KEYS */;
INSERT INTO `cities` VALUES (2,'Lisboa',1,1),(3,'Porto',1,1),(4,'Aveiro',1,1),(5,'Oliveira de Azeméis',1,1),(6,'Guarda',1,1),(7,'Braga',1,1),(8,'Leiria',1,1),(33,'Abrantes',1,0),(34,'Aguiar da Beira',1,0),(35,'Alandroal',1,0),(36,'Albergaria-a-velha',1,0),(37,'Albufeira',1,0),(38,'Alcanena',1,0),(39,'Alcobaça',1,0),(40,'Alcochete',1,0),(41,'Alcoutim',1,0),(42,'Alcácer do Sal',1,0),(43,'Alenquer',1,0),(44,'Alfândega da fé',1,0),(45,'Alijó',1,0),(46,'Aljezur',1,0),(47,'Aljustrel',1,0),(48,'Almada',1,0),(49,'Almeida',1,0),(50,'Almeirim',1,0),(51,'Almodôvar',1,0),(52,'Alpiarça',1,0),(53,'Alter do Chão',1,0),(54,'Alvaiázere',1,0),(55,'Alvito',1,0),(56,'Amadora',1,0),(57,'Amarante',1,0),(58,'Amares',1,0),(59,'Anadia',1,0),(60,'Angra do Heroísmo',1,0),(61,'Ansião',1,0),(62,'Arcos de Valdevez',1,0),(63,'Arganil',1,0),(64,'Armamar',1,0),(65,'Arouca',1,0),(66,'Arraiolos',1,0),(67,'Arronches',1,0),(68,'Arruda Dos Vinhos',1,0),(70,'Avis',1,0),(71,'Azambuja',1,0),(72,'Baião',1,0),(73,'Barcelos',1,0),(74,'Barrancos',1,0),(75,'Barreiro',1,0),(76,'Batalha',1,0),(77,'Beja',1,0),(78,'Belmonte',1,0),(79,'Benavente',1,0),(80,'Bombarral',1,0),(81,'Borba',1,0),(82,'Boticas',1,0),(84,'Bragança',1,0),(85,'Cabeceiras de Basto',1,0),(86,'Cadaval',1,0),(87,'Caldas da Rainha',1,0),(88,'Calheta',1,0),(89,'Calheta de São Jorge',1,0),(90,'Caminha',1,0),(91,'Campo Maior',1,0),(92,'Cantanhede',1,0),(93,'Carrazeda de Ansiães',1,0),(94,'Carregal do Sal',1,0),(95,'Cartaxo',1,0),(96,'Cascais',1,0),(97,'Castanheira de Pêra',1,0),(98,'Castelo Branco',1,0),(99,'Castelo de Paiva',1,0),(100,'Castelo de Vide',1,0),(101,'Castro Daire',1,0),(102,'Castro Marim',1,0),(103,'Castro Verde',1,0),(104,'Celorico da Beira',1,0),(105,'Celorico de Basto',1,0),(106,'Chamusca',1,0),(107,'Chaves',1,0),(108,'Cinfães',1,0),(109,'Coimbra',1,0),(110,'Condeixa-a-nova',1,0),(111,'Constância',1,0),(112,'Coruche',1,0),(113,'Corvo',1,0),(114,'Covilhã',1,0),(115,'Crato',1,0),(116,'Cuba',1,0),(117,'Câmara de Lobos',1,0),(118,'Elvas',1,0),(119,'Entroncamento',1,0),(120,'Espinho',1,0),(121,'Esposende',1,0),(122,'Estarreja',1,0),(123,'Estremoz',1,0),(124,'Fafe',1,0),(125,'Faro',1,0),(126,'Felgueiras',1,0),(127,'Ferreira do Alentejo',1,0),(128,'Ferreira do Zêzere',1,0),(129,'Figueira da Foz',1,0),(130,'Figueira de Castelo Rodrigo',1,0),(131,'Figueiró Dos Vinhos',1,0),(132,'Fornos de Algodres',1,0),(133,'Freixo de Espada à Cinta',1,0),(134,'Fronteira',1,0),(135,'Funchal',1,0),(136,'Fundão',1,0),(137,'Gavião',1,0),(138,'Golegã',1,0),(139,'Gondomar',1,0),(140,'Gouveia',1,0),(141,'Grândola',1,0),(143,'Guimarães',1,0),(144,'Góis',1,0),(145,'Horta',1,0),(146,'Idanha-a-nova',1,0),(147,'Lagoa',1,0),(148,'Lagoa (açores)',1,0),(149,'Lagos',1,0),(150,'Lajes Das Flores',1,0),(151,'Lajes do Pico',1,0),(152,'Lamego',1,0),(155,'Loulé',1,0),(156,'Loures',1,0),(157,'Lourinhã',1,0),(158,'Lousada',1,0),(159,'Lousã',1,0),(160,'Macedo de Cavaleiros',1,0),(161,'Machico',1,0),(162,'Madalena',1,0),(163,'Mafra',1,0),(164,'Maia',1,0),(165,'Mangualde',1,0),(166,'Manteigas',1,0),(167,'Marco de Canaveses',1,0),(168,'Marinha Grande',1,0),(169,'Marvão',1,0),(170,'Matosinhos',1,0),(171,'Mação',1,0),(172,'Mealhada',1,0),(173,'Melgaço',1,0),(174,'Mesão Frio',1,0),(175,'Mira',1,0),(176,'Miranda do Corvo',1,0),(177,'Miranda do Douro',1,0),(178,'Mirandela',1,0),(179,'Mogadouro',1,0),(180,'Moimenta da Beira',1,0),(181,'Moita',1,0),(182,'Monchique',1,0),(183,'Mondim de Basto',1,0),(184,'Monforte',1,0),(185,'Montalegre',1,0),(186,'Montemor-o-novo',1,0),(187,'Montemor-o-velho',1,0),(188,'Montijo',1,0),(189,'Monção',1,0),(190,'Mora',1,0),(191,'Mortágua',1,0),(192,'Moura',1,0),(193,'Mourão',1,0),(194,'Murtosa',1,0),(195,'Murça',1,0),(196,'Mértola',1,0),(197,'Mêda',1,0),(198,'Nazaré',1,0),(199,'Nelas',1,0),(200,'Nisa',1,0),(201,'Nordeste',1,0),(202,'Odemira',1,0),(203,'Odivelas',1,0),(204,'Oeiras',1,0),(205,'Oleiros',1,0),(206,'Olhão',1,0),(208,'Oliveira de Frades',1,0),(209,'Oliveira do Bairro',1,0),(210,'Oliveira do Hospital',1,0),(211,'Ourique',1,0),(212,'Ourém',1,0),(213,'Ovar',1,0),(214,'Palmela',1,0),(215,'Pampilhosa da Serra',1,0),(216,'Paredes',1,0),(217,'Paredes de Coura',1,0),(218,'Paços de Ferreira',1,0),(219,'Pedrógão Grande',1,0),(220,'Penacova',1,0),(221,'Penafiel',1,0),(222,'Penalva do Castelo',1,0),(223,'Penamacor',1,0),(224,'Penedono',1,0),(225,'Penela',1,0),(226,'Peniche',1,0),(227,'Peso da Régua',1,0),(228,'Pinhel',1,0),(229,'Pombal',1,0),(230,'Ponta Delgada',1,0),(231,'Ponta do Sol',1,0),(232,'Ponte da Barca',1,0),(233,'Ponte de Lima',1,0),(234,'Ponte de Sor',1,0),(235,'Portalegre',1,0),(236,'Portel',1,0),(237,'Portimão',1,0),(239,'Porto Moniz',1,0),(240,'Porto Santo',1,0),(241,'Porto de Mós',1,0),(242,'Povoação',1,0),(243,'Praia da Vitória',1,0),(244,'Proença-a-nova',1,0),(245,'Póvoa de Lanhoso',1,0),(246,'Póvoa de Varzim',1,0),(247,'Redondo',1,0),(248,'Reguengos de Monsaraz',1,0),(249,'Resende',1,0),(250,'Ribeira Brava',1,0),(251,'Ribeira Grande',1,0),(252,'Ribeira de Pena',1,0),(253,'Rio Maior',1,0),(254,'Sabrosa',1,0),(255,'Sabugal',1,0),(256,'Salvaterra de Magos',1,0),(257,'Santa Comba Dão',1,0),(258,'Santa Cruz',1,0),(259,'Santa Cruz Das Flores',1,0),(260,'Santa Cruz da Graciosa',1,0),(261,'Santa Maria da Feira',1,0),(262,'Santa Marta de Penaguião',1,0),(263,'Santana',1,0),(264,'Santarém',1,0),(265,'Santiago do Cacém',1,0),(266,'Santo Tirso',1,0),(267,'Sardoal',1,0),(268,'Seia',1,0),(269,'Seixal',1,0),(270,'Sernancelhe',1,0),(271,'Serpa',1,0),(272,'Sertã',1,0),(273,'Sesimbra',1,0),(274,'Setúbal',1,0),(275,'Sever do Vouga',1,0),(276,'Silves',1,0),(277,'Sines',1,0),(278,'Sintra',1,0),(279,'Sobral de Monte Agraço',1,0),(280,'Soure',1,0),(281,'Sousel',1,0),(282,'Sátão',1,0),(283,'São Brás de Alportel',1,0),(284,'São João da Madeira',1,0),(285,'São João da Pesqueira',1,0),(286,'São Pedro do Sul',1,0),(287,'São Roque do Pico',1,0),(288,'São Vicente',1,0),(289,'Tabuaço',1,0),(290,'Tarouca',1,0),(291,'Tavira',1,0),(292,'Terras de Bouro',1,0),(293,'Tomar',1,0),(294,'Tondela',1,0),(295,'Torre de Moncorvo',1,0),(296,'Torres Novas',1,0),(297,'Torres Vedras',1,0),(298,'Trancoso',1,0),(299,'Trofa',1,0),(300,'Tábua',1,0),(301,'Vagos',1,0),(302,'Vale de Cambra',1,0),(303,'Valença',1,0),(304,'Valongo',1,0),(305,'Valpaços',1,0),(306,'Velas',1,0),(307,'Vendas Novas',1,0),(308,'Viana do Alentejo',1,0),(309,'Viana do Castelo',1,0),(310,'Vidigueira',1,0),(311,'Vieira do Minho',1,0),(312,'Vila Flor',1,0),(313,'Vila Franca de Xira',1,0),(314,'Vila Franca do Campo',1,0),(315,'Vila Nova da Barquinha',1,0),(316,'Vila Nova de Cerveira',1,0),(317,'Vila Nova de Famalicão',1,0),(318,'Vila Nova de Foz Côa',1,0),(319,'Vila Nova de Gaia',1,0),(320,'Vila Nova de Paiva',1,0),(321,'Vila Nova de Poiares',1,0),(322,'Vila Pouca de Aguiar',1,0),(323,'Vila Real',1,0),(324,'Vila Real de Santo António',1,0),(325,'Vila Velha de Ródão',1,0),(326,'Vila Verde',1,0),(327,'Vila Viçosa',1,0),(328,'Vila de Rei',1,0),(329,'Vila do Bispo',1,0),(330,'Vila do Conde',1,0),(331,'Vila do Porto',1,0),(332,'Vimioso',1,0),(333,'Vinhais',1,0),(334,'Viseu',1,0),(335,'Vizela',1,0),(336,'Vouzela',1,0),(337,'Águeda',1,0),(338,'Évora',1,0),(339,'Ílhavo',1,0),(340,'Óbidos',1,0),(350,'Bragan',1,0);
/*!40000 ALTER TABLE `cities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company_vehicles`
--

DROP TABLE IF EXISTS `company_vehicles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_vehicles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `brand` varchar(100) NOT NULL,
  `model` varchar(100) NOT NULL,
  `plate` varchar(10) NOT NULL,
  `office_id` int NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `company_vehicles_plate_unique` (`plate`),
  KEY `company_vehicles_office_id_cities_id_fk` (`office_id`),
  CONSTRAINT `company_vehicles_office_id_cities_id_fk` FOREIGN KEY (`office_id`) REFERENCES `cities` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_vehicles`
--

LOCK TABLES `company_vehicles` WRITE;
/*!40000 ALTER TABLE `company_vehicles` DISABLE KEYS */;
INSERT INTO `company_vehicles` VALUES (1,'Ford','Focus','19-86-SV',5,1,'2026-05-05 09:16:15'),(2,'Honda','Civic','95-28-MO',4,1,'2026-05-05 09:17:15'),(3,'Mini','Cooper D','35-PJ-08',4,1,'2026-05-05 09:17:50'),(4,'Volkswagen','Golf Var','27-QS-90',5,1,'2026-05-05 09:18:28'),(5,'Volkswagen','Polo','27-QS-99',4,1,'2026-05-05 09:18:51'),(6,'Toyota','Corolla','79-19-ZU',8,1,'2026-05-05 09:19:12'),(7,'Cupra','Formentor','CA-71-IS',2,1,'2026-05-05 09:19:48'),(8,'Seat','Ibiza Van','96-CM-52',5,1,'2026-05-05 09:20:09'),(9,'Renault','Clio','65-LV-72',4,1,'2026-05-05 09:20:30'),(10,'Tesla','Model 3','BO-29-XH',5,1,'2026-05-05 09:21:15'),(11,'Volvo','V60','AJ-08-GR',3,1,'2026-05-05 09:21:44'),(12,'Volvo','V60','AX-96-FQ',3,1,'2026-05-05 09:22:04'),(13,'Volvo','V60','BD-05-BZ',7,1,'2026-05-05 09:22:46'),(14,'Volvo','V40','06-VU-62',5,1,'2026-05-05 09:23:49'),(15,'Opel','Corsa','08-94-VN',5,1,'2026-05-05 09:24:08'),(16,'Mercedes','.','BH-08-MA',6,1,'2026-05-05 09:24:45'),(17,'Jaguar','I-Pace','BH-77-TE',5,1,'2026-05-05 09:25:14'),(18,'Ford','Puma','BX-69-SU',6,1,'2026-05-05 09:25:34'),(19,'Volvo','V90','CE-38-JM',4,1,'2026-05-05 09:25:52');
/*!40000 ALTER TABLE `company_vehicles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `matches`
--

DROP TABLE IF EXISTS `matches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `matches` (
  `id` int NOT NULL AUTO_INCREMENT,
  `provider_trip_id` int NOT NULL,
  `seeker_trip_id` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `status` varchar(20) NOT NULL DEFAULT 'PENDING',
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `matches_provider_trip_id_idx` (`provider_trip_id`),
  KEY `matches_seeker_trip_id_idx` (`seeker_trip_id`),
  CONSTRAINT `matches_provider_trip_id_trips_id_fk` FOREIGN KEY (`provider_trip_id`) REFERENCES `trips` (`id`) ON DELETE CASCADE,
  CONSTRAINT `matches_seeker_trip_id_trips_id_fk` FOREIGN KEY (`seeker_trip_id`) REFERENCES `trips` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `matches`
--

LOCK TABLES `matches` WRITE;
/*!40000 ALTER TABLE `matches` DISABLE KEYS */;
/*!40000 ALTER TABLE `matches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `trip_id` int NOT NULL,
  `sender_id` varchar(128) NOT NULL,
  `content` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  KEY `messages_sender_id_users_id_fk` (`sender_id`),
  KEY `messages_trip_id_idx` (`trip_id`),
  KEY `messages_created_at_idx` (`created_at`),
  CONSTRAINT `messages_sender_id_users_id_fk` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `messages_trip_id_trips_id_fk` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
INSERT INTO `messages` VALUES (1,131,'6mjKnLQ445Tqr4yeIt87QbabGiv2','OI',0,'2026-06-24 12:10:45');
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sp_requests`
--

DROP TABLE IF EXISTS `sp_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sp_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(128) NOT NULL,
  `origin_id` int DEFAULT NULL,
  `destination_id` int NOT NULL,
  `date_needed` timestamp NOT NULL,
  `justification` text,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `sp_requests_user_id_users_id_fk` (`user_id`),
  KEY `sp_requests_origin_id_cities_id_fk` (`origin_id`),
  KEY `sp_requests_destination_id_cities_id_fk` (`destination_id`),
  CONSTRAINT `sp_requests_destination_id_cities_id_fk` FOREIGN KEY (`destination_id`) REFERENCES `cities` (`id`),
  CONSTRAINT `sp_requests_origin_id_cities_id_fk` FOREIGN KEY (`origin_id`) REFERENCES `cities` (`id`),
  CONSTRAINT `sp_requests_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sp_requests`
--

LOCK TABLES `sp_requests` WRITE;
/*!40000 ALTER TABLE `sp_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `sp_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trip_participants`
--

DROP TABLE IF EXISTS `trip_participants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trip_participants` (
  `id` int NOT NULL AUTO_INCREMENT,
  `trip_id` int NOT NULL,
  `user_id` varchar(128) NOT NULL,
  `joined_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `trip_participants_unique_idx` (`trip_id`,`user_id`),
  KEY `trip_participants_trip_id_idx` (`trip_id`),
  KEY `trip_participants_user_id_idx` (`user_id`),
  CONSTRAINT `trip_participants_trip_id_trips_id_fk` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`) ON DELETE CASCADE,
  CONSTRAINT `trip_participants_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=62 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trip_participants`
--

LOCK TABLES `trip_participants` WRITE;
/*!40000 ALTER TABLE `trip_participants` DISABLE KEYS */;
INSERT INTO `trip_participants` VALUES (19,40,'7VVPVl93L4VITRfdT0On6mrtVPp2','2026-03-25 11:59:13'),(28,51,'7VVPVl93L4VITRfdT0On6mrtVPp2','2026-03-27 16:19:47'),(29,55,'E9bBqfRjtReRpTuAQftv8RiSsSY2','2026-03-27 16:22:12'),(30,62,'7VVPVl93L4VITRfdT0On6mrtVPp2','2026-03-30 14:10:43'),(31,57,'7VVPVl93L4VITRfdT0On6mrtVPp2','2026-03-30 14:29:16'),(43,74,'DLjBXSrbWiOIG1iE15rRuHSNFYC3','2026-05-04 14:51:35'),(44,80,'0bBi9MgWsVZYxwEW35hmGIwHiao1','2026-05-04 15:18:49'),(46,83,'cI60ScTbmXTwpJKFSuS01HfyWDr1','2026-05-05 08:28:20'),(47,91,'hdFMeYKco6XQbMPRcgix5Es4EOz1','2026-05-05 16:11:23'),(49,94,'E9bBqfRjtReRpTuAQftv8RiSsSY2','2026-05-08 15:57:45'),(52,100,'7VVPVl93L4VITRfdT0On6mrtVPp2','2026-05-13 14:12:54'),(53,101,'0GcHCSv0l5ZR4Hr408XCaHKqIQD2','2026-05-13 14:16:11'),(55,106,'3PYr27edDmZFtI0iupg6aFbwKUn2','2026-05-20 21:56:09'),(61,131,'6mjKnLQ445Tqr4yeIt87QbabGiv2','2026-06-19 10:32:14');
/*!40000 ALTER TABLE `trip_participants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trip_subscriptions`
--

DROP TABLE IF EXISTS `trip_subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trip_subscriptions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` varchar(128) NOT NULL,
  `origin_id` int NOT NULL,
  `destination_id` int NOT NULL,
  `duration_type` varchar(20) NOT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `trip_subscriptions_user_origin_dest_idx` (`user_id`,`origin_id`,`destination_id`),
  KEY `trip_subscriptions_origin_id_cities_id_fk` (`origin_id`),
  KEY `trip_subscriptions_destination_id_cities_id_fk` (`destination_id`),
  KEY `trip_subscriptions_active_idx` (`is_active`),
  CONSTRAINT `trip_subscriptions_destination_id_cities_id_fk` FOREIGN KEY (`destination_id`) REFERENCES `cities` (`id`),
  CONSTRAINT `trip_subscriptions_origin_id_cities_id_fk` FOREIGN KEY (`origin_id`) REFERENCES `cities` (`id`),
  CONSTRAINT `trip_subscriptions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trip_subscriptions`
--

LOCK TABLES `trip_subscriptions` WRITE;
/*!40000 ALTER TABLE `trip_subscriptions` DISABLE KEYS */;
/*!40000 ALTER TABLE `trip_subscriptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trips`
--

DROP TABLE IF EXISTS `trips`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trips` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(128) NOT NULL,
  `type` varchar(20) NOT NULL,
  `origin_id` int NOT NULL,
  `destination_id` int NOT NULL,
  `departure_time` timestamp NOT NULL,
  `return_time` timestamp NULL DEFAULT NULL,
  `available_seats` int NOT NULL DEFAULT '0',
  `vehicle_type` text,
  `trip_vehicle_details` text,
  `company_vehicle_id` int DEFAULT NULL,
  `hidden` tinyint(1) NOT NULL DEFAULT '0',
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `trips_destination_id_cities_id_fk` (`destination_id`),
  KEY `trips_company_vehicle_id_company_vehicles_id_fk` (`company_vehicle_id`),
  KEY `trips_user_id_idx` (`user_id`),
  KEY `trips_status_idx` (`status`),
  KEY `trips_departure_time_idx` (`departure_time`),
  KEY `trips_origin_dest_idx` (`origin_id`,`destination_id`),
  CONSTRAINT `trips_company_vehicle_id_company_vehicles_id_fk` FOREIGN KEY (`company_vehicle_id`) REFERENCES `company_vehicles` (`id`),
  CONSTRAINT `trips_destination_id_cities_id_fk` FOREIGN KEY (`destination_id`) REFERENCES `cities` (`id`),
  CONSTRAINT `trips_origin_id_cities_id_fk` FOREIGN KEY (`origin_id`) REFERENCES `cities` (`id`),
  CONSTRAINT `trips_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=134 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trips`
--

LOCK TABLES `trips` WRITE;
/*!40000 ALTER TABLE `trips` DISABLE KEYS */;
INSERT INTO `trips` VALUES (11,'7VVPVl93L4VITRfdT0On6mrtVPp2','NEEDRIDE',2,5,'2026-04-11 13:21:00',NULL,0,NULL,'null',NULL,0,'ACTIVE','2026-03-23 16:21:44','2026-03-23 16:21:44'),(13,'7VVPVl93L4VITRfdT0On6mrtVPp2','PROVIDER',4,6,'2026-03-22 16:44:00',NULL,1,'Viatura Pessoal','{\"brand\":\"Seat Ibiza\",\"plate\":\"12-RR-23\"}',NULL,0,'ACTIVE','2026-03-23 16:45:02','2026-03-23 16:45:02'),(15,'7VVPVl93L4VITRfdT0On6mrtVPp2','PROVIDER',4,5,'2026-03-24 11:46:00',NULL,0,'Viatura da Empresa','{\"brand\":\"Ferrari S26\",\"plate\":\"DE-12-DD\"}',NULL,0,'ACTIVE','2026-03-23 16:46:56','2026-03-23 16:46:56'),(35,'08YObFtk3qQ4anMqG6z0jsmL9SI2','PROVIDER',7,7,'2026-03-26 11:42:00',NULL,2,'Viatura da Empresa','{\"brand\":\"chevrolet\",\"plate\":\"12-AA-13\"}',NULL,0,'CANCELLED','2026-03-25 11:42:41','2026-03-25 11:42:41'),(36,'08YObFtk3qQ4anMqG6z0jsmL9SI2','PROVIDER',7,6,'2026-03-26 11:42:00',NULL,2,'Viatura da Empresa','{\"brand\":\"chevrolet\",\"plate\":\"12-AA-13\"}',NULL,0,'ACTIVE','2026-03-25 11:43:20','2026-03-25 11:43:20'),(37,'7VVPVl93L4VITRfdT0On6mrtVPp2','NEEDRIDE',7,6,'2026-03-26 11:43:00',NULL,0,NULL,'null',NULL,1,'MATCHED','2026-03-25 11:43:40','2026-03-25 11:43:40'),(39,'08YObFtk3qQ4anMqG6z0jsmL9SI2','PROVIDER',4,7,'2026-03-26 11:56:00',NULL,1,'Viatura da Empresa','{\"brand\":\"opel\",\"plate\":\"12-34-ER\"}',NULL,0,'CANCELLED','2026-03-25 11:58:47','2026-03-25 11:58:47'),(40,'08YObFtk3qQ4anMqG6z0jsmL9SI2','PROVIDER',4,7,'2026-03-26 11:56:00',NULL,0,'Viatura da Empresa','{\"brand\":\"opel\",\"plate\":\"12-34-ER\"}',NULL,0,'ACTIVE','2026-03-25 11:58:57','2026-03-25 11:58:57'),(42,'7VVPVl93L4VITRfdT0On6mrtVPp2','PROVIDER',6,4,'2026-03-27 15:51:00',NULL,0,'Viatura Pessoal','{\"brand\":\"Seat Ibiza\",\"plate\":\"12-RR-23\"}',NULL,0,'ACTIVE','2026-03-25 15:52:01','2026-03-25 15:52:01'),(43,'7VVPVl93L4VITRfdT0On6mrtVPp2','PROVIDER',7,4,'2026-03-28 15:54:00',NULL,1,'Viatura Pessoal','{\"brand\":\"Seat Ibiza\",\"plate\":\"12-RR-23\"}',NULL,0,'ACTIVE','2026-03-25 15:55:36','2026-03-25 15:55:36'),(44,'7VVPVl93L4VITRfdT0On6mrtVPp2','PROVIDER',7,4,'2026-03-29 14:54:00',NULL,2,'Viatura Pessoal','{\"brand\":\"Seat Ibiza\",\"plate\":\"12-RR-23\"}',NULL,0,'CANCELLED','2026-03-25 15:56:11','2026-03-25 15:56:11'),(48,'7VVPVl93L4VITRfdT0On6mrtVPp2','PROVIDER',4,2,'2026-03-26 17:31:00',NULL,0,'Viatura Pessoal','{\"brand\":\"Seat Ibiza\",\"plate\":\"AA-12-AA\"}',NULL,0,'ACTIVE','2026-03-25 17:31:09','2026-03-25 17:31:09'),(49,'E9bBqfRjtReRpTuAQftv8RiSsSY2','NEEDRIDE',2,5,'2026-03-26 17:50:00',NULL,0,NULL,'null',NULL,0,'ACTIVE','2026-03-25 17:50:26','2026-03-25 17:50:26'),(50,'7VVPVl93L4VITRfdT0On6mrtVPp2','NEEDRIDE',284,5,'2026-04-03 11:28:00',NULL,0,NULL,'null',NULL,1,'MATCHED','2026-03-27 12:28:43','2026-03-27 12:28:43'),(51,'E9bBqfRjtReRpTuAQftv8RiSsSY2','PROVIDER',284,5,'2026-04-03 11:29:00',NULL,2,'Viatura da Empresa','{\"brand\":\"BMW\",\"plate\":\"23-45-TT\"}',NULL,0,'CANCELLED','2026-03-27 12:29:54','2026-03-27 12:29:54'),(54,'7VVPVl93L4VITRfdT0On6mrtVPp2','PROVIDER',2,5,'2026-05-02 15:15:00',NULL,0,'Viatura Pessoal','{\"brand\":\"Seat Ibiza\",\"plate\":\"AA-12-AA\"}',NULL,0,'ACTIVE','2026-03-27 16:16:00','2026-03-27 16:16:00'),(55,'7VVPVl93L4VITRfdT0On6mrtVPp2','PROVIDER',5,2,'2026-04-27 15:20:00',NULL,0,'Viatura Pessoal','{\"brand\":\"Seat Ibiza\",\"plate\":\"AA-12-AA\"}',NULL,0,'ACTIVE','2026-03-27 16:21:06','2026-03-27 16:21:06'),(56,'7VVPVl93L4VITRfdT0On6mrtVPp2','NEEDRIDE',5,2,'2026-04-28 15:20:00',NULL,0,NULL,'null',NULL,0,'CANCELLED','2026-03-27 16:21:27','2026-03-27 16:21:27'),(57,'E9bBqfRjtReRpTuAQftv8RiSsSY2','PROVIDER',5,2,'2026-04-28 15:22:00',NULL,0,'Viatura da Empresa','{\"brand\":\"teste\",\"plate\":\"12-QQ-12\"}',NULL,0,'ACTIVE','2026-03-27 16:22:37','2026-03-27 16:22:37'),(58,'7VVPVl93L4VITRfdT0On6mrtVPp2','NEEDRIDE',5,2,'2026-04-28 08:40:00',NULL,0,NULL,'null',NULL,0,'CANCELLED','2026-03-30 08:40:41','2026-03-30 08:40:41'),(59,'7VVPVl93L4VITRfdT0On6mrtVPp2','NEEDRIDE',5,2,'2026-04-28 08:44:00',NULL,0,NULL,'null',NULL,0,'CANCELLED','2026-03-30 08:44:35','2026-03-30 08:44:35'),(60,'7VVPVl93L4VITRfdT0On6mrtVPp2','NEEDRIDE',5,2,'2026-04-28 09:01:00',NULL,0,NULL,'null',NULL,0,'CANCELLED','2026-03-30 09:01:40','2026-03-30 09:01:40'),(61,'7VVPVl93L4VITRfdT0On6mrtVPp2','NEEDRIDE',5,2,'2026-04-28 09:19:00',NULL,0,NULL,'null',NULL,1,'MATCHED','2026-03-30 09:19:18','2026-03-30 09:19:18'),(62,'08YObFtk3qQ4anMqG6z0jsmL9SI2','PROVIDER',284,5,'2026-04-03 14:07:00',NULL,0,'Viatura da Empresa','{\"brand\":\"Opel\",\"plate\":\"90-OO-90\"}',NULL,0,'ACTIVE','2026-03-30 14:07:43','2026-03-30 14:07:43'),(63,'08YObFtk3qQ4anMqG6z0jsmL9SI2','PROVIDER',7,6,'2026-04-10 15:43:00',NULL,1,'Viatura Pessoal','{\"brand\":\"BMW\",\"plate\":\"67-AH-67\"}',NULL,0,'ACTIVE','2026-03-30 15:43:47','2026-03-30 15:43:47'),(65,'7VVPVl93L4VITRfdT0On6mrtVPp2','PROVIDER',4,5,'2026-04-16 15:45:00',NULL,2,'Viatura Pessoal','{\"brand\":\"Seat Ibiza\",\"plate\":\"AA-12-AA\"}',NULL,0,'ACTIVE','2026-03-30 15:45:31','2026-03-30 15:45:31'),(66,'E9bBqfRjtReRpTuAQftv8RiSsSY2','PROVIDER',5,7,'2026-04-08 15:46:00',NULL,0,'Viatura da Empresa','{\"brand\":\"Lamborghini\",\"plate\":\"EF-03-AA\"}',NULL,0,'ACTIVE','2026-03-30 15:47:21','2026-03-30 15:47:21'),(70,'7VVPVl93L4VITRfdT0On6mrtVPp2','NEEDRIDE',5,7,'2026-04-16 08:25:00',NULL,0,NULL,'null',NULL,0,'ACTIVE','2026-04-13 08:26:16','2026-04-13 08:26:16'),(72,'7VVPVl93L4VITRfdT0On6mrtVPp2','PROVIDER',7,6,'2026-04-22 15:26:00',NULL,0,'Viatura Pessoal','{\"brand\":\"Seat Ibiza\",\"plate\":\"AA-12-AA\"}',NULL,0,'ACTIVE','2026-04-20 15:26:20','2026-04-20 15:26:20'),(73,'7VVPVl93L4VITRfdT0On6mrtVPp2','PROVIDER',5,3,'2026-04-26 11:24:00',NULL,0,'Viatura Pessoal','{\"brand\":\"Seat Ibiza\",\"plate\":\"AA-12-AA\"}',NULL,0,'ACTIVE','2026-04-24 11:24:57','2026-04-24 11:24:57'),(74,'7VVPVl93L4VITRfdT0On6mrtVPp2','PROVIDER',5,3,'2026-05-28 10:09:00',NULL,1,'Viatura da Empresa','{\"brand\":\"Opel Corsa\",\"plate\":\"12-JJ-23\"}',NULL,0,'CANCELLED','2026-05-04 10:09:52','2026-05-04 10:09:52'),(77,'cI60ScTbmXTwpJKFSuS01HfyWDr1','PROVIDER',3,5,'2026-05-05 07:00:00',NULL,1,'Viatura da Empresa','{\"brand\":\"Volvo V60\",\"plate\":\"AJ-08-GR\"}',NULL,0,'ACTIVE','2026-05-04 14:57:41','2026-05-04 14:57:41'),(78,'H4lljDQpFscRSjDMeShYupHhLOG3','NEEDRIDE',4,5,'2026-05-05 07:30:00',NULL,0,NULL,'null',NULL,0,'ACTIVE','2026-05-04 14:58:55','2026-05-04 14:58:55'),(79,'i5CooumpI0a2Qvk18R4eK4rKlW72','PROVIDER',36,5,'2026-05-05 07:00:00',NULL,1,'Viatura Pessoal','{\"brand\":\"Peugeot 107\",\"plate\":\"AA-12-34\"}',NULL,0,'ACTIVE','2026-05-04 15:02:43','2026-05-04 15:02:43'),(80,'CALBJTVSvBO3wUPneQY7W3nU7lz2','PROVIDER',319,5,'2026-05-05 07:30:00',NULL,0,'Viatura da Empresa','{\"brand\":\"Volvo V40\",\"plate\":\"AJ-08-GR\"}',NULL,0,'ACTIVE','2026-05-04 15:04:39','2026-05-04 15:04:39'),(81,'UG0nhgdNR3cQg05UAymJjglUmnz2','PROVIDER',5,6,'2026-05-05 06:45:00',NULL,3,'Viatura da Empresa','{\"brand\":\"VW Golf\",\"plate\":\"27-QS-90\"}',NULL,0,'ACTIVE','2026-05-04 15:18:38','2026-05-04 15:18:38'),(82,'0bBi9MgWsVZYxwEW35hmGIwHiao1','NEEDRIDE',319,3,'2026-05-05 15:18:00',NULL,0,NULL,'null',NULL,0,'ACTIVE','2026-05-04 15:18:43','2026-05-04 15:18:43'),(83,'hdFMeYKco6XQbMPRcgix5Es4EOz1','PROVIDER',5,2,'2026-05-05 18:00:00',NULL,2,'Viatura da Empresa','{\"brand\":\"Cupra Formentor\",\"plate\":\"CA-71-IS\"}',NULL,0,'CANCELLED','2026-05-04 15:24:52','2026-05-04 15:24:52'),(84,'CyZCt6CJUbPSrornEnHinDWWd7Q2','NEEDRIDE',3,5,'2026-05-28 07:00:00',NULL,0,NULL,'null',NULL,0,'ACTIVE','2026-05-04 19:27:50','2026-05-04 19:27:50'),(85,'CyZCt6CJUbPSrornEnHinDWWd7Q2','PROVIDER',139,284,'2026-05-27 07:00:00',NULL,4,'Viatura Pessoal','{\"brand\":\"Ford Focus\",\"plate\":\"AJ-98-PH\"}',NULL,0,'ACTIVE','2026-05-04 19:34:34','2026-05-04 19:34:34'),(86,'hdFMeYKco6XQbMPRcgix5Es4EOz1','PROVIDER',5,4,'2026-05-05 11:20:00',NULL,3,'Viatura Pessoal','{\"brand\":\"Cupra Formentor\",\"plate\":\"CA-71-IS\"}',NULL,0,'ACTIVE','2026-05-05 08:31:46','2026-05-05 08:31:46'),(87,'hdFMeYKco6XQbMPRcgix5Es4EOz1','PROVIDER',4,2,'2026-05-05 18:00:00',NULL,3,'Viatura Pessoal','{\"brand\":\"Cupra Formentor\",\"plate\":\"CA-71-IS\"}',NULL,0,'ACTIVE','2026-05-05 08:32:10','2026-05-05 08:32:10'),(88,'7VVPVl93L4VITRfdT0On6mrtVPp2','PROVIDER',5,7,'2026-05-06 09:26:00',NULL,1,'Viatura da Empresa','{\"brand\":\"Ford Focus\",\"plate\":\"19-86-SV\"}',1,0,'CANCELLED','2026-05-05 09:28:58','2026-05-05 09:28:58'),(89,'7VVPVl93L4VITRfdT0On6mrtVPp2','PROVIDER',5,4,'2026-05-06 09:39:00','2026-05-07 09:39:00',1,'Viatura da Empresa','{\"brand\":\"Ford Focus\",\"plate\":\"19-86-SV\"}',1,0,'ACTIVE','2026-05-05 09:40:08','2026-05-05 09:40:08'),(90,'7VVPVl93L4VITRfdT0On6mrtVPp2','PROVIDER',5,7,'2026-05-07 09:40:00','2026-05-11 09:40:00',2,'Viatura da Empresa','{\"brand\":\"Jaguar I-Pace\",\"plate\":\"BH-77-TE\"}',17,0,'CANCELLED','2026-05-05 09:40:54','2026-05-05 09:40:54'),(91,'UG0nhgdNR3cQg05UAymJjglUmnz2','PROVIDER',4,5,'2026-05-07 07:15:00',NULL,3,'Viatura da Empresa','{\"brand\":\"Honda civic\",\"plate\":\"95-28-MO\"}',NULL,0,'ACTIVE','2026-05-05 14:47:53','2026-05-05 14:47:53'),(92,'hdFMeYKco6XQbMPRcgix5Es4EOz1','PROVIDER',2,284,'2026-05-28 05:00:00',NULL,1,'Viatura Pessoal','{\"brand\":\"Cupra Formentor\",\"plate\":\"CA-71-IS\"}',NULL,0,'ACTIVE','2026-05-06 09:41:08','2026-05-06 09:41:08'),(93,'hdFMeYKco6XQbMPRcgix5Es4EOz1','PROVIDER',284,2,'2026-05-28 18:00:00',NULL,1,'Viatura Pessoal','{\"brand\":\"Cupra Formentor\",\"plate\":\"CA-71-IS\"}',NULL,0,'ACTIVE','2026-05-06 09:41:44','2026-05-06 09:41:44'),(94,'7VVPVl93L4VITRfdT0On6mrtVPp2','PROVIDER',4,7,'2026-05-11 13:15:00','2026-05-11 14:15:00',0,'Viatura da Empresa','{\"brand\":\"Honda Civic\",\"plate\":\"95-28-MO\"}',2,0,'CANCELLED','2026-05-08 13:15:36','2026-05-08 15:59:57'),(95,'7VVPVl93L4VITRfdT0On6mrtVPp2','PROVIDER',4,8,'2026-05-13 08:19:00','2026-05-14 08:17:00',1,'Viatura da Empresa','{\"brand\":\"Honda Civic\",\"plate\":\"95-28-MO\"}',2,0,'ACTIVE','2026-05-11 08:20:04','2026-05-11 08:20:04'),(97,'7VVPVl93L4VITRfdT0On6mrtVPp2','PROVIDER',2,7,'2026-05-12 16:47:00','2026-05-12 16:48:00',1,'Viatura da Empresa','{\"brand\":\"Ford Focus\",\"plate\":\"19-86-SV\"}',1,0,'ACTIVE','2026-05-11 16:48:24','2026-05-11 16:48:24'),(99,'7VVPVl93L4VITRfdT0On6mrtVPp2','NEEDRIDE',3,5,'2026-05-17 14:11:00',NULL,0,NULL,'null',NULL,1,'MATCHED','2026-05-13 14:11:17','2026-05-13 14:11:17'),(100,'E9bBqfRjtReRpTuAQftv8RiSsSY2','PROVIDER',3,5,'2026-05-17 14:11:00','2026-05-17 17:11:00',1,'Viatura da Empresa','{\"brand\":\"Volvo V60\",\"plate\":\"AX-96-FQ\"}',12,0,'ACTIVE','2026-05-13 14:12:04','2026-05-13 14:12:04'),(101,'E9bBqfRjtReRpTuAQftv8RiSsSY2','PROVIDER',7,8,'2026-05-15 14:15:00','2026-05-16 17:15:00',0,'Viatura da Empresa','{\"brand\":\"Volvo V60\",\"plate\":\"BD-05-BZ\"}',13,0,'ACTIVE','2026-05-13 14:15:24','2026-05-13 14:15:24'),(102,'0GcHCSv0l5ZR4Hr408XCaHKqIQD2','NEEDRIDE',7,8,'2026-05-15 14:15:00',NULL,0,NULL,'null',NULL,1,'MATCHED','2026-05-13 14:15:58','2026-05-13 14:15:58'),(103,'wJlvlWtVR4NjdvUrW9Y8VR4ZsST2','NEEDRIDE',3,5,'2026-05-19 07:00:00',NULL,0,NULL,'null',NULL,0,'ACTIVE','2026-05-15 15:18:37','2026-05-15 15:18:37'),(104,'wJlvlWtVR4NjdvUrW9Y8VR4ZsST2','NEEDRIDE',3,5,'2026-05-20 07:00:00',NULL,0,NULL,'null',NULL,0,'ACTIVE','2026-05-15 15:20:20','2026-05-15 15:20:20'),(105,'UG0nhgdNR3cQg05UAymJjglUmnz2','PROVIDER',4,5,'2026-05-19 07:15:00','2026-05-19 17:00:00',4,'Viatura da Empresa','{\"brand\":\"Mini Cooper D\",\"plate\":\"35-PJ-08\"}',3,0,'ACTIVE','2026-05-18 14:57:24','2026-05-18 14:57:24'),(106,'UG0nhgdNR3cQg05UAymJjglUmnz2','PROVIDER',4,5,'2026-05-21 07:15:00','2026-05-21 17:00:00',3,'Viatura da Empresa','{\"brand\":\"Mini Cooper D\",\"plate\":\"35-PJ-08\"}',3,0,'ACTIVE','2026-05-18 15:03:25','2026-05-18 15:03:25'),(107,'7VVPVl93L4VITRfdT0On6mrtVPp2','PROVIDER',7,8,'2026-05-20 11:17:00',NULL,3,'Viatura Pessoal','{\"brand\":\"Seat Ibiza\",\"plate\":\"12-AA-12\"}',NULL,0,'ACTIVE','2026-05-20 09:17:49','2026-05-20 09:21:15'),(109,'7VVPVl93L4VITRfdT0On6mrtVPp2','PROVIDER',8,6,'2026-05-23 09:25:00',NULL,1,'Viatura Pessoal','{\"brand\":\"Seat Ibiza\",\"plate\":\"12-AA-12\"}',NULL,0,'ACTIVE','2026-05-20 09:25:29','2026-05-20 09:25:29'),(111,'UG0nhgdNR3cQg05UAymJjglUmnz2','PROVIDER',4,5,'2026-05-25 07:15:00','2026-05-25 17:00:00',3,'Viatura da Empresa','{\"brand\":\"Mini Cooper D\",\"plate\":\"35-PJ-08\"}',3,0,'ACTIVE','2026-05-21 10:06:05','2026-05-21 10:06:05'),(112,'UG0nhgdNR3cQg05UAymJjglUmnz2','PROVIDER',4,5,'2026-05-26 07:15:00','2026-05-26 17:00:00',3,'Viatura da Empresa','{\"brand\":\"Mini Cooper D\",\"plate\":\"35-PJ-08\"}',NULL,0,'CANCELLED','2026-05-21 10:06:43','2026-05-21 10:06:43'),(113,'UG0nhgdNR3cQg05UAymJjglUmnz2','PROVIDER',4,284,'2026-05-28 07:30:00','2026-05-28 18:00:00',3,'Viatura da Empresa','{\"brand\":\"Mini Cooper D\",\"plate\":\"35-PJ-08\"}',3,0,'ACTIVE','2026-05-21 10:07:40','2026-05-21 10:07:40'),(119,'CALBJTVSvBO3wUPneQY7W3nU7lz2','PROVIDER',319,284,'2026-05-28 07:00:00','2026-05-28 07:15:00',3,'Viatura da Empresa','{\"brand\":\"Volvo V60\",\"plate\":\"AX-96-FQ\"}',12,0,'ACTIVE','2026-05-22 14:18:40','2026-05-22 14:30:34'),(120,'7VVPVl93L4VITRfdT0On6mrtVPp2','PROVIDER',2,5,'2026-05-30 09:57:00',NULL,0,'Viatura Pessoal','{\"brand\":\"Seat Ibiza\",\"plate\":\"12-AA-12\"}',NULL,0,'ACTIVE','2026-05-29 09:57:10','2026-05-29 09:57:10'),(122,'E9bBqfRjtReRpTuAQftv8RiSsSY2','PROVIDER',5,4,'2026-06-02 16:49:00','2026-06-02 16:49:00',1,'Viatura da Empresa','{\"brand\":\"Ford Focus\",\"plate\":\"19-86-SV\"}',1,0,'ACTIVE','2026-05-29 16:49:23','2026-05-29 16:49:23'),(123,'E9bBqfRjtReRpTuAQftv8RiSsSY2','PROVIDER',5,4,'2026-05-31 16:50:00','2026-05-31 16:50:00',1,'Viatura da Empresa','{\"brand\":\"Jaguar I-Pace\",\"plate\":\"BH-77-TE\"}',17,0,'ACTIVE','2026-05-29 16:50:40','2026-05-29 16:50:40'),(124,'7VVPVl93L4VITRfdT0On6mrtVPp2','NEEDRIDE',5,3,'2026-07-03 16:23:00',NULL,0,NULL,'null',NULL,0,'ACTIVE','2026-06-03 16:23:16','2026-06-03 16:23:16'),(126,'0GcHCSv0l5ZR4Hr408XCaHKqIQD2','PROVIDER',5,3,'2026-07-03 16:25:00','2026-07-04 16:25:00',1,'Viatura da Empresa','{\"brand\":\"Ford Focus\",\"plate\":\"19-86-SV\"}',1,0,'ACTIVE','2026-06-03 16:25:49','2026-06-03 16:25:49'),(127,'UG0nhgdNR3cQg05UAymJjglUmnz2','PROVIDER',4,5,'2026-06-09 07:15:00','2026-06-09 07:15:00',4,'Viatura da Empresa','{\"brand\":\"Mini Cooper D\",\"plate\":\"35-PJ-08\"}',3,0,'ACTIVE','2026-06-06 06:01:48','2026-06-06 06:01:48'),(128,'CyZCt6CJUbPSrornEnHinDWWd7Q2','PROVIDER',139,5,'2026-07-13 07:15:00',NULL,3,'Viatura Pessoal','{\"brand\":\"Ford Focus\",\"plate\":\"AJ-98-PH\"}',NULL,0,'ACTIVE','2026-06-12 11:48:54','2026-06-12 11:48:54'),(129,'7VVPVl93L4VITRfdT0On6mrtVPp2','PROVIDER',2,4,'2026-06-29 09:00:00',NULL,0,'Viatura Pessoal','{\"brand\":\"Seat Ibiza\",\"plate\":\"12-AA-12\"}',NULL,0,'CANCELLED','2026-06-15 09:00:42','2026-06-15 09:00:42'),(131,'7VVPVl93L4VITRfdT0On6mrtVPp2','PROVIDER',3,5,'2026-06-26 10:16:00',NULL,1,'Viatura Pessoal','{\"brand\":\"Opel Corsa\",\"plate\":\"12-AA-12\"}',NULL,0,'CANCELLED','2026-06-19 10:16:50','2026-06-19 10:16:50'),(132,'6mjKnLQ445Tqr4yeIt87QbabGiv2','NEEDRIDE',3,5,'2026-06-26 10:30:00',NULL,0,NULL,'null',NULL,0,'CANCELLED','2026-06-19 10:25:49','2026-06-19 10:25:49'),(133,'6mjKnLQ445Tqr4yeIt87QbabGiv2','NEEDRIDE',3,5,'2026-06-26 10:36:00',NULL,0,NULL,'null',NULL,0,'ACTIVE','2026-06-19 10:31:09','2026-06-19 10:31:09');
/*!40000 ALTER TABLE `trips` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(128) NOT NULL,
  `email` varchar(255) NOT NULL,
  `username` varchar(255) NOT NULL,
  `avatar_url` text,
  `phone` varchar(20) DEFAULT NULL,
  `vehicle_info` text,
  `is_admin` tinyint(1) NOT NULL DEFAULT '0',
  `is_verified` tinyint(1) NOT NULL DEFAULT '0',
  `verification_code` varchar(10) DEFAULT NULL,
  `verification_expiry` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()),
  `fcm_token` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  UNIQUE KEY `users_username_unique` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('08YObFtk3qQ4anMqG6z0jsmL9SI2','u4347828913@gmail.com','Rui André','https://lh3.googleusercontent.com/a/ACg8ocLGH7GQj0Y5Nkdn7ueeqSLyg0IRytR0EgufqCg8xk1uxMnBCg=s96-c',NULL,'{\"brand\":\"BMW\",\"plate\":\"67-AH-67\"}',0,1,NULL,NULL,'2026-03-25 11:19:04','2026-04-21 09:09:59',NULL),('0bBi9MgWsVZYxwEW35hmGIwHiao1','vitorcosta@loba.com','vitor_costa647','https://lh3.googleusercontent.com/a/ACg8ocKc6NCB70GdWS7nnnqbJPnVKDMjFNW8aqo5OdOIWudY9o0O4HP8=s96-c',NULL,'null',0,1,NULL,NULL,'2026-05-04 15:17:17','2026-05-04 15:15:49','fo4UxEeK62bYSFFFwuv9-X:APA91bFS1B3sZsBy4afPsnBUhY2TZLYknj2LMcsT9nLADRlMQXuZB3IjV0qaWhMefJuM5CcFFl2GhkVi9qKMGSwSQDemHaWOTSC9rHfZQ4fILs-JFR6D2nU'),('0GcHCSv0l5ZR4Hr408XCaHKqIQD2','u7246878324@gmail.com','Rui Presente','https://lh3.googleusercontent.com/a/ACg8ocL_6lgP5Gl3E8PIJ0OKaO8CoNIMm2HAGVBgZKkVHo_EArIDkA=s96-c',NULL,'',0,1,NULL,NULL,'2026-04-29 15:48:34','2026-06-15 08:34:41','fiXR5OVDj6ERFL3GOvBVx6:APA91bHEOVZOxR4gSzx0uE6ukyw0n-kElIvHYHntQJ9qwfZGP1PpNji5oavkcUSi0AGThSvSHv6knGkbveHc1lDvWCd4D1w_RjI4ApLeYdIJqXqPlqlvdac'),('3PYr27edDmZFtI0iupg6aFbwKUn2','anaforte@loba.com','ana_forte170','https://lh3.googleusercontent.com/a/ACg8ocJmPDLR8QNCFOJQB9ItzSehI2T1h0A6QSYqXo5BGYPBzCAJrdV1=s96-c',NULL,'null',0,1,NULL,NULL,'2026-05-18 08:26:40','2026-05-29 10:30:27',NULL),('44gLPVas1FSC7sGGt1qVZHiySoz1','alexandremarques@loba.com','alexandremarques311',NULL,NULL,'null',0,1,NULL,NULL,'2026-05-18 16:19:43','2026-05-18 16:17:53',NULL),('6mjKnLQ445Tqr4yeIt87QbabGiv2','joaosantos@loba.com','joão_santos215','https://lh3.googleusercontent.com/a/ACg8ocJbF6Ff6snZJlzPUsisd8lWYORjD8V8UhdjX-UfmKXwsEZmgA=s96-c',NULL,'null',1,1,NULL,NULL,'2026-06-19 10:09:49','2026-06-24 12:09:53',NULL),('7VVPVl93L4VITRfdT0On6mrtVPp2','jpgomessantos1@gmail.com','João Santos','https://lh3.googleusercontent.com/a/ACg8ocKQT8w65ILoNRCDYCrMIYH7MdZEA_MF6o3OdcxxBI7lI7NsrPY2=s96-c','918358203','{\"brand\":\"Opel Corsa X3\",\"plate\":\"12-AA-12\"}',1,1,NULL,NULL,'2026-03-18 10:35:01','2026-06-24 12:11:14','cPcVkD44Rw-e2UV3FQtyzn:APA91bGd52bzp_CKokdXDvP54oG58jErXLw-szrECFpj0wr7sNNRTWbRUiHzTfvBVJYC6GRmeMFIjikVJYv1K7K3QCUck8vKvybQ9wsn-yVh7TP5DBU7Rl8'),('CALBJTVSvBO3wUPneQY7W3nU7lz2','elsa@loba.com','Elsa Marques',NULL,'913037818','{\"brand\":\"Volvo V60\",\"plate\":\"AX-96-FQ\"}',0,1,NULL,NULL,'2026-05-04 14:59:16','2026-06-12 07:56:47',NULL),('cI60ScTbmXTwpJKFSuS01HfyWDr1','osvaldo@loba.com','osvaldo_pinto111','https://lh3.googleusercontent.com/a/ACg8ocK8NvJKcHr7V4Zvp620ODw6LNLzXLFUecFifCh101TV0-sg2ruG=s96-c',NULL,'null',0,1,NULL,NULL,'2026-05-04 14:53:47','2026-05-05 08:24:24','exuyTtzKvKyRJoxFkSuQQW:APA91bG0q3OQZhBjHnXO8P8jmC57tyBOK6auGKDbbDIZke9xuxcPyiucvdUSXNftkbhODLp7_do0nAsAuTdQsC5-3TOWsnU6DsOuVIput5NT7abkk_J4Zjg'),('ColfK74ORRWabMcVNvzMqUvDDVE3','hugopeixoto@loba.com','hugopeixoto138',NULL,NULL,'null',0,1,NULL,NULL,'2026-04-29 16:43:58','2026-05-15 15:06:17',NULL),('CyZCt6CJUbPSrornEnHinDWWd7Q2','adrianasoares@loba.com','Adriana Soares','https://lh3.googleusercontent.com/a/ACg8ocLFb-UgSKEBR9tKGty70J73sT0dPxLon2_y2sNQCbsbq3yAADZ2=s96-c','928501743','{\"brand\":\"Ford Focus\",\"plate\":\"AJ-98-PH\"}',0,1,NULL,NULL,'2026-05-04 19:25:52','2026-06-12 11:44:35','dN84KzcntLNxc_c2UMhIL4:APA91bGzwFbz49dvc18RNu9lly5G5zzd8iW5k6a9Z936BN3pr2hK_obSjjDgaQLG8DB42ZyqseT2IgivS9e4IN5Xmy8JHe-Nb8Gv3GJyLiX3qNPxueCoGHQ'),('DLjBXSrbWiOIG1iE15rRuHSNFYC3','nunoalves@loba.com','nunoalves23','https://lh3.googleusercontent.com/a/ACg8ocIxUeHllXHWFHVoxKHTwskIwj5kgVKAh5GwMpv6a6CO9J4OXC6H=s96-c',NULL,'null',1,1,NULL,NULL,'2026-04-29 15:35:51','2026-05-04 16:17:44','cZs9nU8vnzFjfO1rRcaR6W:APA91bHX_MLbfhyMzG662xMgGbCPzxyyf4Ie_fObEzEUJdjGRalWFchI7jI7I-Kcyxn68ATjs2bZRv4mayr-ZIkyMcwoZvtuK_v5czNVbV6b1OuuKyPXUlY'),('E9bBqfRjtReRpTuAQftv8RiSsSY2','u6763065879@gmail.com','Paulo Augusto','https://lh3.googleusercontent.com/a/ACg8ocLDoDP4JWwCoB82ayORgmlgfXtpTOUM9udq3waIg9fx6EGqhg=s96-c','987987987','',0,1,NULL,NULL,'2026-03-25 15:01:05','2026-05-29 16:51:45',NULL),('fujUkyugtWXNzfdKtI3xBsx7Mpo2','ekaterinaaksenova@loba.com','Kate Aksenova',NULL,'916861440','{\"brand\":\"Toyota Avensis\",\"plate\":\"40-66-UA\"}',0,1,NULL,NULL,'2026-05-04 14:52:45','2026-06-12 10:40:17',NULL),('H4lljDQpFscRSjDMeShYupHhLOG3','fabiomendes@loba.com','fabiomendes351',NULL,NULL,'null',0,1,NULL,NULL,'2026-05-04 14:57:25','2026-05-04 15:01:46',NULL),('hdFMeYKco6XQbMPRcgix5Es4EOz1','manuel@loba.com','Manuel Pinhão','https://lh3.googleusercontent.com/a/ACg8ocLqQhC58zRGQ0lJlU4_8w-fpaE3WTi0_KQ2jfe9BDAj-tftv-WCNg=s96-c','912993862','{\"brand\":\"Cupra Formentor\",\"plate\":\"CA-71-IS\"}',0,1,NULL,NULL,'2026-05-04 15:22:40','2026-05-22 16:36:13',NULL),('i5CooumpI0a2Qvk18R4eK4rKlW72','marcio@loba.com','márcio_brasil613','https://lh3.googleusercontent.com/a/ACg8ocK-K5_TjpZPKuj64amK4oBfwhtjGZEnSJLhNTNTElTixxnPvjlV=s96-c',NULL,'{\"brand\":\"Peugeot 107\",\"plate\":\"AA-12-34\"}',0,1,NULL,NULL,'2026-05-04 14:52:46','2026-05-05 15:36:30',NULL),('IVrNnUQDpRbzmJk9c79PEUPYtoJ3','erica@loba.com','érica_gonçalves667','https://lh3.googleusercontent.com/a/ACg8ocKfNG-YnfntYxUM-H2dqBklX7IcdLWLVPW3WjtXARYuxieY-fw=s96-c',NULL,'null',0,1,NULL,NULL,'2026-05-04 15:35:27','2026-06-06 10:30:38','fp_ybQ0mKmVxOyPMT4Mg_Y:APA91bH0ndejmVg537LsEUSuX0QRt8BupjMGRH4sG3KugOS1ARduKQ_VldQvqYYJA2lJ7Dgz9pRjbIrta2DW6MsIwfeT-pjiKkdR3dSWszknLMNF_k7MzNU'),('lA8fgjax0zgA9kkQyvatAOOYQIo1','teresajesus@loba.com','teresajesus952',NULL,NULL,'null',0,1,NULL,NULL,'2026-05-04 14:57:41','2026-05-04 14:56:07',NULL),('UG0nhgdNR3cQg05UAymJjglUmnz2','paula@loba.com','paula_dinis','https://lh3.googleusercontent.com/a/ACg8ocKpnP2qvZ4MpTz0g997zJQ5-fZ8nK7rd6OS9XNPb05UrZsmDN8j=s96-c',NULL,'',0,1,NULL,NULL,'2026-05-04 15:11:45','2026-06-06 05:58:16',NULL),('wJlvlWtVR4NjdvUrW9Y8VR4ZsST2','beatrizmedeiros@loba.com','beatriz_medeiros709','https://lh3.googleusercontent.com/a/ACg8ocKr2uxBSRCQKaUSgsP3DntjyqGVehRVCPnfwaEuj75U_5k08dw=s96-c',NULL,'null',0,1,NULL,NULL,'2026-05-15 15:16:33','2026-05-18 08:02:51','cycbCysDdFIsqDfKiBOMlW:APA91bFwpXThA5ywxSKapX4lJl8SV8jCG1I3yaqpKtjgmZNnNOtjN-dYJYhUgO80WOjyNFlnfb4N_bvPRsUVlLKzzxsEbYnUnWu_6PXI1yIzK7d53ne9B_g');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-24 12:17:03

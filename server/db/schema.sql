-- Esquema de Settflix para el backend serverless.
-- Es seguro ejecutarlo varias veces (IF NOT EXISTS) y también sobre la BD que
-- ya usaba Django: auth_user y favoritas son IDÉNTICAS a las de Django, así los
-- usuarios y favoritas existentes siguen funcionando.

SET NAMES utf8mb4;

-- Usuarios (misma tabla/columnas que django.contrib.auth.User).
-- La contraseña se guarda como "pbkdf2_sha256$iter$salt$hash" (formato Django).
CREATE TABLE IF NOT EXISTS `auth_user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `password` varchar(128) NOT NULL,
  `last_login` datetime(6) DEFAULT NULL,
  `is_superuser` tinyint(1) NOT NULL,
  `username` varchar(150) NOT NULL,
  `first_name` varchar(150) NOT NULL,
  `last_name` varchar(150) NOT NULL,
  `email` varchar(254) NOT NULL,
  `is_staff` tinyint(1) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `date_joined` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Favoritas (misma tabla que el modelo Django `Favorita`).
CREATE TABLE IF NOT EXISTS `favoritas` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `id_pelicula` varchar(20) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `anio` varchar(10) DEFAULT NULL,
  `poster` varchar(500) DEFAULT NULL,
  `nota` smallint unsigned DEFAULT NULL,
  `fecha_agregado` datetime(6) NOT NULL,
  `usuario_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unica_favorita_por_usuario` (`usuario_id`,`id_pelicula`),
  CONSTRAINT `favoritas_usuario_id_fk_auth_user_id` FOREIGN KEY (`usuario_id`) REFERENCES `auth_user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `nota_favorita_entre_1_y_5` CHECK ((`nota` IS NULL) OR ((`nota` >= 1) AND (`nota` <= 5)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- NUEVA: refresh tokens ya usados o cerrados (reemplaza token_blacklist_* de SimpleJWT).
-- Solo guarda el jti (id del token) y cuándo expira; las filas vencidas se limpian solas.
CREATE TABLE IF NOT EXISTS `jwt_blacklist` (
  `jti` char(32) NOT NULL,
  `expires_at` datetime NOT NULL,
  PRIMARY KEY (`jti`),
  KEY `idx_jwt_blacklist_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- NUEVA: caché de OMDb (reemplaza Redis). Sobrevive a reinicios y es compartida
-- por todas las instancias de la Lambda.
CREATE TABLE IF NOT EXISTS `omdb_cache` (
  `cache_key` varchar(80) NOT NULL,
  `payload` longtext NOT NULL,
  `expires_at` datetime NOT NULL,
  PRIMARY KEY (`cache_key`),
  KEY `idx_omdb_cache_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

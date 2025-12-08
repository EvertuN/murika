# Sistema de Gestão de Hotel
## 100% MURIKA
### O melhor, maior e mais humilde sistema de gerenciamento de hoteis existente
```
docker-compose up -d

containers:
    - murika-php | 68f2b9aaa609
    - mysql:5.7 | d08135c28362
    - phpmyadmin/phpmyadmin | 0e4614d8779a
```

## DB
```
CREATE TABLE auth_users (
id CHAR(36) PRIMARY KEY,
nome VARCHAR(100) NOT NULL,
usuario VARCHAR(50) NOT NULL UNIQUE,
senha VARCHAR(255) NOT NULL,
tipo ENUM('admin','usuario') NOT NULL DEFAULT 'usuario',
ativo TINYINT(1) NOT NULL DEFAULT 1
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `auth_tentativa_login` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ip` varchar(45) NOT NULL,
  `username` varchar(255) NOT NULL,
  `attempt_time` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE TABLE `auth_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(36) DEFAULT NULL,
  `action` varchar(50) NOT NULL,
  `details` json DEFAULT NULL,
  `ip` varchar(45) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
)

CREATE TABLE hotel_cargo (
	id_cargo INT NOT NULL AUTO_INCREMENT,
	cargo VARCHAR(25),
	PRIMARY KEY (id_cargo)
);

CREATE TABLE hotel_funcionarios (
	id_funcionario INT NOT NULL AUTO_INCREMENT,
	nome VARCHAR(50) NOT NULL,
	id_cargo INT,
	PRIMARY KEY (id_funcionario),
	FOREIGN KEY (id_cargo) REFERENCES hotel_cargo(id_cargo)
);
```

#Melhorias

!!Admin não consegue desativar usuarios, logs não possível de acessar

!!Alterar quantidade minima

!!Filtro de turno não funciona
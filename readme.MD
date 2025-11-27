# Sistema de Gestão de Hotel
## 100% MURIKA

```
docker-compose up -d

containers:
    - murika-php | 68f2b9aaa609
    - mysql:5.7 | d08135c28362
    - phpmyadmin/phpmyadmin | 0e4614d8779a
```

## DB
```
CREATE TABLE estoque_item(
	id_item INT AUTO_INCREMENT,
    nome VARCHAR(50),
    id_categoria INT,
    controla_frigobar TINYINT(1),
    PRIMARY KEY(id_item),
    FOREIGN KEY (id_categoria) REFERENCES estoque_categorias_item(id_categoria)
);
```


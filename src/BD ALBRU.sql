create database Albru;

CREATE USER albru_user WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE albru TO albru_user;
docker run --name postgres-albru -e POSTGRES_USER=albru_user -e POSTGRES_PASSWORD=password -e POSTGRES_DB=albru -p 5432:5432 -d postgres:14
npm install pg

CREATE TABLE CLIENTES (
   id SERIAL PRIMARY KEY,
   nombre VARCHAR(100),
   telefono VARCHAR(15),
   dni VARCHAR(50),
   gestion VARCHAR(50),
   seguimiento TIMESTAMP
   Tipo_cliente VARCHAR(50),
   Asesor_id INT REFERENCES asesores(id),
   lead VARCHAR(15),
   coordenadas VARCHAR(100),
   score INT,
   Tipo_documento VARCHAR(50),
   Fecha_Nacimiento DATE,
   Lugar_Nacimiento VARCHAR(100),
   Correo_electronico VARCHAR(100),
   Numero_registro VARCHAR(50),
   Numero_grabacion VARCHAR(50),
   Titular_linea VARCHAR(100),
   Distrito VARCHAR (100),
   Numero_piso VARCHAR(10),
   Plan_bono VARCHAR(150);
);

CREATE TABLE asesores (
id SERIAL PRIMARY KEY ,
nombre VARCHAR(100),
estado VARCHAR(50),
clientes_asignados INT
);

CREATE TABLE historial_gestion(
id SERIAL PRIMARY KEY,
cliente_id INT REFERENCES clientes(id),
fecha  TIMESTAMP,
accion VARCHAR(100),
comentarios TEXT
);

psql -U albru_user -d albru -f backend/config/schema.sql

select * from clientes 

INSERT INTO CLIENTES(nombre,telefono,dni,gestion,seguimiento)
VALUES 
('Juan','956149567','56789234','llamada','2025-09-23'),
('Alvaro','987345893','56789127','campaña','2025-09-20'),
('Ricardo','967345678','56781234','canal','2025-09-17');

INSERT INTO asesores(nombre,estado,clientes_asignados)
VALUES
('Jorgue','Activo','6'),
('Mirella','Activo','12'),
('Juan','Inactivo','5');

INSERT INTO historial_gestion(cliente_id,fecha,accion,comentarios)
VALUES
('1','24/08/2025','accion','cliente pidio infromacion de la linea'),
('2','12/07/2025','accion','cliente pidio infromacion de la linea'),
('3','4/06/2025','accion','cliente pidio infromacion de la linea');


DROP TABLE historial_gestion;

select * from CLIENTES
select * from asesores

ALTER TABLE CLIENTES
ADD COLUMN Tipo_cliente VARCHAR(50),
ADD COLUMN Asesor_id INT REFERENCES asesores(id),
ADD COLUMN lead VARCHAR(15),
ADD COLUMN coordenadas VARCHAR(100),
ADD COLUMN score INT,
ADD COLUMN Tipo_documento VARCHAR(50),
ADD COLUMN Fecha_Nacimiento DATE,
ADD COLUMN Lugar_Nacimiento VARCHAR(100),
ADD COLUMN Correo_electronico VARCHAR(100),
ADD COLUMN Numero_registro VARCHAR(50),
ADD COLUMN Numero_grabacion VARCHAR(50),
ADD COLUMN Titular_linea VARCHAR(100),
ADD COLUMN Distrito VARCHAR (100),
ADD COLUMN Numero_piso VARCHAR(10),
ADD COLUMN Plan_bono VARCHAR(150);

select * from CLIENTES

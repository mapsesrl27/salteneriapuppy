-- Ejecutar DESPUÉS de 01_schema.sql y de crear tu usuario en Authentication > Users.
-- Cambia solo el correo y el nombre entre comillas.

insert into perfiles (id, nombre, rol)
select id, 'Propietario', 'admin'
from auth.users
where email = 'CAMBIA_ESTE_CORREO@gmail.com';

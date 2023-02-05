# Project haystack
Este repositorio fue clonado de [este repositorio](https://bitbucket.org/lynxspring/nodehaystack/src/master/) y se realizaron los cambios necesarios para el uso en la investigación. <br/>
A continuación se detalla la estructura que deben tener las peticiones. El formato recomendado para el cuerpo de la petición es **JSON** a pesar que el api permite enviar peticiones en otros formatos, como **CSV** o **Zinc**, sin embargo, para este proyecto se usará JSON por la facilidad de lectura y escritura. <br/>

## Formato del cuerpo de la petición

El formato de la petición es el siguiente
```json
{
"_kind": "grid",
"meta": {"ver":"2.0", "meta1": "type:value"},
"cols": [{"name":"value1"},{"name":"value2"}],
"rows":[{"value1":"type:value", "value2":"type:value"}]
}
```
Todos los valores de cada clave en el mapa, exceptuando las más externas y el tag `"ver"`, deben incluir el tipo de dato. Por defecto existen varios tipos de datos, cada uno representado por una letra, sin embargo, para este proyecto solo es necesario conocer 4:
* `r`: Para referenciar otra entidad en la base de datos, este tipo de dato se usa cuando el valor sea el id de un punto o un sitio guardado en la base de datos, por ejemplo `r:c6c5f4a5-5252-4f04-9e4e-7203d6107a0b`
* `s`: Para cadenas de texto, por ejemplo, `s:Prueba"`
* `n`: Para números enteros o flotantes, además se puede agregar la unidad de medida de forma opcional, por ejemplo, `n:5000 KM`
* `t`: Para fechas con zona horaria. Haystack utiliza las zonas horarias de la libreria [moment-timezone](https://gist.github.com/diogocapela/12c6617fc87607d11fd62d2a4f42b02a). Por ejemplo: `t:2023-01-24T23:00:00-05:00 New_York`

La clave `meta` es un mapa que siempre debe incluir el tag `"ver":"2.0"`, para las peticiones `POST` es necesario enviar el tag `"id"` junto al valor respectivo del punto o el sitio. <br/>

La clave `cols` es un arreglo de mapas, donde cada mapa tiene un único par clave-valor, donde la clave **siempre** es `name` y el valor es el nombre de la columna, por ejemplo `"cols": [{"name":"geoCity"},{"name":"geoState"},{"name":"area"}]`

La clave `row` es un arreglo de mapas, donde cada mapa tiene tantos pares clave-valor como elementos en el arreglo de la clave `cols`, las claves **siempre** deben coincidir con el nombre y el order de las claves en `cols`. Por ejemplo: `"rows":[{"geoCity":"s:Guayaquil", "geoState":"s:ESPOL", "area": "n:5000 KM"}]`

## Endpoints para enviar las peticiones
La variable `url` se debe reemplazar por el url donde esté alojado el rest api, en caso de trabajar en local debe ser `http://localhost:3000`, en caso de tenerlo alojado en un servidor en la nube cambiar la variable por la url adecuada.

* `ops`: Esta operación permite conocer las operaciones disponibles. Se utiliza el método **GET**. El endpoint es `url/ops`.
* `nav`: Esta operación permite leer los sitios y puntos registrados en la base de datos. Se utiliza el método **GET**.Se debe incluir el parámetro `type` que puede tener valor `site` o `point`. El enpoint es `url/nav?type=site`
* `read`: Esta operación permite obtener información sobre un punto. Se utiliza el método **GET**. Se debe incluir el `id` del punto a leer con un `@` antes del id. El endpoint es `url/read?id=@12345`
* `hisRead`: Esta operación permite leer las mediciones obtenidas por un dispositivo (punto). Se utiliza el método **GET**. Se debe incluir el `id` del dispositivo y el `range` el cual puede ser `yesterday` o dos fechas separadas por coma, por ejemplo `2023-01-01,2023-01-31`. El endpoint es `url/hisRead?id=ABC&range=yesterday`
* `hisWrite`: Esta operación permite escribir mediciones obtenidas por el dispositivo (punto). Se utiliza el método **POST**. Se debe incluir el `id` del dispositivo en el tag `meta` del cuerpo de la petición. Las columnas deben ser `ts` y `val` y en el tag `rows` se deben incluir valores para cada columna. El endpoint es `url/hisWrite`. Un ejemplo de la petición es 
```
{
"_kind": "grid",
"meta": {"ver":"2.0", "id":"r:c6c5f4a5-5252-4f04-9e4e-7203d6107a0b"},
"cols": [{"name":"ts"},{"name":"val"}],
"rows":[{"ts":"t:2023-01-24T23:00:00-05:00 New_York", "val":"n:41.1"}]
}
```
* `about`: Esta operación brinda información sobre el servidor. El método utilizado es **GET**. El enpoint es `url/about`
* `formats`: Esta operación brinda información sobre los formatos aceptados para enviar o recibir los datos. El método utilizado es **GET**. El enpoint es `url/formats`
* 

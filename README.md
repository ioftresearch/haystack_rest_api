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



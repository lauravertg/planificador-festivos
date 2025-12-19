# Vue 3 + Vite

This template should help get you started developing with Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about IDE Support for Vue in the [Vue Docs Scaling up Guide](https://vuejs.org/guide/scaling-up/tooling.html#ide-support).
PLANIFICADOR DE LA OPERATIVA PRODUCTIVA Y LOGÍSTICA DE LA EMPRESA PARA LOS FESTIVOS
📌 1. Descripción general de la operativa

Cada vez que llega un festivo, gestionamos una tabla donde:



Filas = plataformas logísticas (clientes) donde entregamos pedidos.

Columnas = días alrededor del festivo (normalmente ± 1 semana, siendo el festivo la fecha central).

En cada casilla (cliente × día) anotamos información clave de cada pedido.

Quiero digitalizar todo esto y que cada casilla se convierta en un “registro de pedido para un cliente y un día concreto”.

📌 2. Información que hoy ponemos en cada casilla (campos necesarios)

En cada casilla se define si:

¿Entrega ese día?

Sí → registrar datos

No → marcar "NO" y listo

Si la respuesta es SÍ, necesito registrar estos campos:

a) Fecha y hora de recepción del pedido (color azul, esquina superior izquierda)

Día de la semana (L, M, X, J, V...)

Fecha

Hora (opcional)

b) Fecha de fabricación (color verde, esquina inferior izquierda)

Día o fecha prevista de fabricación

Posibilidad de añadir notas (ej.: “fabricar a previsión”, “hacer picking”, etc.)

c) Fecha de carga (color naranja, esquina inferior derecha)

Día de la semana o fecha

Esta fecha será clave para informes

d) Compañía de transporte (color negro/otro, esquina superior derecha)

Ej.: Innova, Primafrío, etc.

📌 3. Entidades de datos que la app debe tener

1. Clientes / Plataformas

Nombre

Código opcional

Dirección opcional

2. Festivos

Nombre del festivo

Fecha

Rango de fechas a mostrar en la tabla (inicio – fin)

3. Días del plan

Fecha

Día de la semana

Relación con un festivo

4. Pedidos

Cada registro es una “casilla” con los siguientes campos:



Cliente

Fecha del día (columna)

¿Entrega ese día? (Sí/No)

Fecha/hora de recepción

Fecha de fabricación

Notas de fabricación

Compañía de transporte

Fecha de carga

Comentarios adicionales para transporte

📌 4. Funcionalidades que debe tener la app

A. Vista tipo tabla (como la pizarra)

Filas = clientes

Columnas = días asociados al festivo

En cada celda, un pequeño resumen del pedido:

Si entrega (sí/no)

Compañía

Fabricación

Carga

Al abrir una casilla → formulario completo

B. Editor fácil para cada casilla

Formulario con:



Selector de cliente

Selector de día

Selector de compañía de transporte

Fecha carga

Fecha fabricación

Fecha/hora de recepción

Notas internas

Comentarios para transporte

📌 5. Informes que necesito generar

Informe por compañía de transporte

Ejemplo: cargas de Innova para un festivo.



Entrada:

Festivo

Compañía de transporte

Salida:

Tabla agrupada por fecha de carga
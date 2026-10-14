# Token de acceso al estado compartido de /gasolina

## Qué es y qué protege

El estado de `/gasolina` y `/car-sharing` (ciclos, viajes, mantenimiento) es
**compartido entre varias personas** que aportan al mismo vehículo. No pertenece
a un usuario de la aplicación, y no todas las participantes tienen cuenta.

Por eso la escritura se controla con un **token compartido**, no con la sesión:

- **Lectura**: pública. Se puede consultar el estado sin credenciales.
- **Escritura**: exige el token. Todas las Server Actions de
  `src/app/gasolina/actions.ts` y las mutantes de `maintenance.actions.ts` lo
  verifican antes de tocar nada.

El control vive en el servidor. La interfaz solo comunica si el modo edición está
activo; ocultar un botón no protege nada.

## Emitir el primer token

```bash
npx tsx scripts/set-car-access-token.ts --generate
```

Imprime el token **una única vez**. Solo se guarda su SHA-256 en el documento
`car_sharing_config/access`, así que no es recuperable: si se pierde, se genera
otro.

Para fijar un valor elegido en lugar de generarlo:

```bash
npx tsx scripts/set-car-access-token.ts "mi-token-largo-y-aleatorio"
```

## Entregar el token a las participantes

En `/gasolina`, el campo **Token de acceso** aparece arriba. Se escribe una vez,
se guarda en una cookie `httpOnly` de 30 días, y a partir de ahí las acciones de
escritura quedan habilitadas hasta que se pulse **Bloquear**.

La cookie almacena el hash del token, no el token. Un volcado de cookies no sirve
directamente como credencial.

## Rotar el token

Rota cuando alguna participante deja de fiarse del estado, ante una sospecha
de filtración, o de forma periódica.

```bash
# 1. Generar el nuevo
npx tsx scripts/set-car-access-token.ts --generate

# 2. Comunicarlo. Las cookies emitidas con el token anterior dejan de validar
#    de inmediato: hasCarAccess() compara contra el hash almacenado.

# 3. Cada participante lo ingresa de nuevo en /gasolina.
```

La rotación es inmediata y no requiere despliegue. **No hay periodo de solape**:
el valor antiguo queda inválido en cuanto se escribe el nuevo hash. Si necesitas
convivir ambos durante un traspaso, hay que decidirlo antes; hoy el modelo es
un solo token.

## Variables de entorno

| Variable | Efecto |
|---|---|
| `ALLOWED_ORIGIN` | Origen contra el que se comparan las peticiones mutantes. Muy recomendable fijarlo: sin él se usa el `Host` de la petición, que un atacante con control de esa cabecera podría hacer coincidir. |
| `RATE_LIMIT_MODE=observe` | Los limitadores registran lo que bloquearían sin bloquear. Se usa para calibrar umbrales contra tráfico real antes de activar el rechazo. |

## Nota sobre `firestore.rules`

Las reglas están en modo denegar-todo. El acceso real pasa por `firebase-admin`,
que las bypasea, así que **el control de escritura de esta feature depende del
guard en las Server Actions, no de las reglas**.

Antes de desplegar las reglas:

```bash
npm run verify:client-firestore
```

Falla si algún día alguien importa el SDK de cliente, en lugar de dejar que el
fallo aparezca en runtime como un error de permisos confuso.
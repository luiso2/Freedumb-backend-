# 🔐 JWT Secrets - FREEDUMB Backend

## 📍 Ubicación de los Secrets

Los JWT secrets están configurados en el archivo `.env` en la raíz del proyecto:

```
/Desktop/freedumb/.env
```

## 🔑 Secrets Actuales (Generados Automáticamente)

### JWT Access Token Secret
```
JWT_SECRET=24534a4ec8349e8ea295132b4f93a809f7216157a3a696b6d344b9fc91faf80f97a7016f4f50a9048c4d2f519b37191095502e52e71f24950e64744118a5ff03
```
- **Longitud**: 128 caracteres
- **Uso**: Firmar access tokens (duración: 15 minutos en producción, 24h en desarrollo)
- **Algoritmo**: HS256 (HMAC-SHA256)

### JWT Refresh Token Secret
```
JWT_REFRESH_SECRET=0ae49569b93d382a68c9bbff366e13368df4aa433279a223406cac13d636618b2c287b5d72a8113eae79cdd0669a9772948ec961d39143967a3d2a384ff2c0bb
```
- **Longitud**: 128 caracteres
- **Uso**: Firmar refresh tokens (duración: 7 días)
- **Algoritmo**: HS256 (HMAC-SHA256)

### Encryption Key (AES-256)
```
ENCRYPTION_KEY=5df44cfb5df58ed27b3cce0db152cc4a0466bc160f4c2312856d2402adc88929
```
- **Longitud**: 64 caracteres (32 bytes)
- **Uso**: Encriptar datos sensibles (números de cuenta, información bancaria)
- **Algoritmo**: AES-256-GCM

### Encryption IV (Initialization Vector)
```
ENCRYPTION_IV=6c9b2b1a14c2bf20
```
- **Longitud**: 16 caracteres
- **Uso**: Vector de inicialización para encriptación AES

---

## 🔄 Regenerar Secrets

Si necesitas regenerar los secrets por seguridad o rotación periódica:

### Opción 1: Actualización Automática (Recomendado)
```bash
node scripts/generate-secrets.js --update
```
- ✅ Genera nuevos secrets criptográficamente seguros
- ✅ Crea backup automático del .env anterior
- ✅ Actualiza el .env automáticamente

### Opción 2: Solo Visualizar (Sin actualizar)
```bash
node scripts/generate-secrets.js
```
- Muestra los nuevos secrets sin actualizar el .env
- Útil para copiar manualmente

---

## ⚠️ Consideraciones de Seguridad

### ✅ Best Practices Implementadas

1. **Longitud Segura**:
   - Secrets de 128 caracteres (mucho más que el mínimo recomendado de 32)

2. **Generación Aleatoria**:
   - Usa `crypto.randomBytes()` (criptográficamente seguro)
   - NO usa Math.random() ni strings predecibles

3. **Algoritmo Robusto**:
   - HS256 (HMAC con SHA-256)
   - AES-256-GCM para encriptación de datos

4. **Separación de Secrets**:
   - Access tokens y refresh tokens usan secrets diferentes
   - Aumenta la seguridad en caso de compromiso

### 🔒 Seguridad en Producción

**IMPORTANTE**: Los secrets actuales son para **DESARROLLO** solamente.

Para **PRODUCCIÓN**:

1. **NO uses estos secrets en producción**
2. **Genera secrets diferentes para cada ambiente**:
   - Desarrollo (local)
   - Staging (pruebas)
   - Producción

3. **Usa un gestor de secrets**:
   - AWS Secrets Manager
   - HashiCorp Vault
   - Google Cloud Secret Manager
   - Azure Key Vault

4. **Variables de Entorno en Deploy**:
   ```bash
   # Railway
   railway variables set JWT_SECRET="tu-secret-de-prod"

   # Heroku
   heroku config:set JWT_SECRET="tu-secret-de-prod"

   # Vercel
   vercel env add JWT_SECRET
   ```

### 🚫 NO Hacer

❌ **NO** commits secrets al repositorio Git
❌ **NO** compartas secrets por email/Slack/Discord
❌ **NO** uses el mismo secret en dev y producción
❌ **NO** hardcodees secrets en el código
❌ **NO** expongas secrets en logs

### ✅ SÍ Hacer

✅ Mantén `.env` en `.gitignore`
✅ Usa `.env.example` sin valores reales
✅ Rota secrets cada 90 días
✅ Revoca tokens inmediatamente si hay brecha
✅ Usa HTTPS en producción
✅ Implementa rate limiting

---

## 📂 Archivos Relacionados

```
freedumb/
├── .env                          # Secrets actuales (NO commitear)
├── .env.example                  # Template sin valores reales
├── .env.backup.XXXXXXXXX         # Backups automáticos
├── scripts/
│   ├── generate-secrets.js      # Generador de secrets
│   └── generate-token.js        # Generador de tokens JWT
└── SECRETS_INFO.md              # Este archivo
```

---

## 🔍 Verificar Secrets

Para verificar que los secrets están configurados correctamente:

```bash
# Ver secrets actuales (ofuscar en producción)
grep -E "JWT_SECRET|ENCRYPTION" .env

# Verificar que no estén en Git
git check-ignore .env  # Debe mostrar: .env

# Ver backups disponibles
ls -la .env.backup.*
```

---

## 🔄 Política de Rotación

### Cuándo Rotar Secrets

1. **Cada 90 días** (política recomendada)
2. **Inmediatamente** si:
   - Hubo una brecha de seguridad
   - Un empleado con acceso dejó la empresa
   - Los secrets fueron expuestos accidentalmente
   - Migración de ambiente

### Proceso de Rotación

```bash
# 1. Generar nuevos secrets
node scripts/generate-secrets.js --update

# 2. Reiniciar el servidor
npm restart

# 3. Notificar a usuarios (opcional)
# Todos los tokens existentes se invalidarán

# 4. Documentar la rotación
echo "Rotated on $(date)" >> .secret-rotation.log
```

---

## 📊 Backup de Secrets

Los scripts crean backups automáticos:

```bash
# Lista todos los backups
ls -lt .env.backup.* | head -5

# Restaurar un backup específico
cp .env.backup.1761321782852 .env

# Eliminar backups antiguos (mayores a 30 días)
find . -name ".env.backup.*" -mtime +30 -delete
```

---

## 🆘 En Caso de Compromiso

Si los secrets son comprometidos:

1. **Inmediatamente**:
   ```bash
   # Generar nuevos secrets
   node scripts/generate-secrets.js --update

   # Reiniciar servidor
   npm restart
   ```

2. **Invalidar todos los tokens**:
   - Implementar blacklist en Redis
   - Forzar logout de todos los usuarios

3. **Notificar**:
   - Team de seguridad
   - Usuarios (si aplica)

4. **Investigar**:
   - Revisar logs de acceso
   - Identificar el origen del compromiso
   - Implementar medidas preventivas

---

## 📚 Referencias

- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Cryptographic Storage](https://owasp.org/www-project-top-ten/)
- [Node.js Crypto Documentation](https://nodejs.org/api/crypto.html)

---

**Última Actualización**: Octubre 24, 2025
**Script Versión**: 1.0.0
**Estado**: ✅ Secrets configurados y seguros

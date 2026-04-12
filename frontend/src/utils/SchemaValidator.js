/**
 * Validador de Esquemas Ligero
 * Valida las respuestas de la API sin dependencias externas
 */

class ValidationError extends Error {
  constructor(message, path = "", received = null) {
    super(message);
    this.name = "ValidationError";
    this.path = path;
    this.received = received;
  }
}

/**
 * Esquemas de validación para respuestas comunes
 */
const schemas = {
  /**
   * Respuesta de autenticación
   */
  loginResponse: {
    type: "object",
    properties: {
      token: { type: "string" },
      user: {
        type: "object",
        properties: {
          id: { type: ["string", "number"] },
          name: { type: "string" },
          email: { type: "string" },
          roles: { type: "array" },
        },
        required: ["id"],
      },
    },
    required: ["token", "user"],
  },

  /**
   * Respuesta de perfil
   */
  profileResponse: {
    type: "object",
    properties: {
      id: { type: ["string", "number"] },
      name: { type: "string" },
      email: { type: "string" },
      phone: { type: "string" },
      roles: { type: "array" },
    },
    required: ["id"],
  },

  /**
   * Respuesta de lista de items
   */
  listResponse: {
    type: "object",
    properties: {
      data: { type: "array" },
      count: { type: "number" },
      total: { type: "number" },
      page: { type: "number" },
      pageSize: { type: "number" },
    },
  },

  /**
   * Respuesta de item único
   */
  itemResponse: {
    type: "object",
    properties: {
      data: { type: "object" },
      id: { type: ["string", "number"] },
    },
  },

  /**
   * Respuesta de condominio
   */
  condominioResponse: {
    type: "object",
    properties: {
      id: { type: ["string", "number"] },
      name: { type: "string" },
      address: { type: "string" },
      city: { type: "string" },
    },
    required: ["id", "name"],
  },

  /**
   * Respuesta de error estándar
   */
  errorResponse: {
    type: "object",
    properties: {
      detail: { type: "string" },
      error: { type: ["string", "object"] },
      message: { type: "string" },
      code: { type: "string" },
    },
  },
};

/**
 * Validador de tipo
 */
function validateType(value, type) {
  // Tipo puede ser string, array de strings, o null
  if (!type) return true;

  const types = Array.isArray(type) ? type : [type];

  return types.some((t) => {
    if (t === "string") return typeof value === "string";
    if (t === "number") return typeof value === "number";
    if (t === "boolean") return typeof value === "boolean";
    if (t === "object") return value !== null && typeof value === "object" && !Array.isArray(value);
    if (t === "array") return Array.isArray(value);
    if (t === "null") return value === null;
    return true;
  });
}

/**
 * Validar un valor contra un esquema
 */
function validateValue(value, schema, path = "root") {
  if (!schema) return { valid: true };

  // Validar tipo
  if (schema.type) {
    if (!validateType(value, schema.type)) {
      return {
        valid: false,
        error: new ValidationError(
          `Tipo inválido en ${path}: se esperaba ${
            Array.isArray(schema.type) ? schema.type.join("|") : schema.type
          }, se recibió ${typeof value}`,
          path,
          value
        ),
      };
    }
  }

  // Validar propiedades si es objeto
  if (schema.properties && typeof value === "object" && value !== null && !Array.isArray(value)) {
    // Validar propiedades requeridas
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in value)) {
          return {
            valid: false,
            error: new ValidationError(
              `Campo requerido faltante en ${path}: ${field}`,
              `${path}.${field}`,
              value
            ),
          };
        }
      }
    }

    // Validar cada propiedad
    for (const [key, fieldSchema] of Object.entries(schema.properties)) {
      if (key in value) {
        const fieldResult = validateValue(value[key], fieldSchema, `${path}.${key}`);
        if (!fieldResult.valid) {
          return fieldResult;
        }
      }
    }
  }

  // Validar items si es array
  if (schema.items && Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const itemResult = validateValue(value[i], schema.items, `${path}[${i}]`);
      if (!itemResult.valid) {
        return itemResult;
      }
    }
  }

  return { valid: true };
}

/**
 * Validar respuesta contra un esquema
 */
function validate(data, schema) {
  if (!schema) return { valid: true };

  const result = validateValue(data, schema);
  return result;
}

/**
 * Envoltura para validar dentro de un try-catch
 */
function validateOrThrow(data, schema) {
  const result = validate(data, schema);
  if (!result.valid) {
    throw result.error;
  }
  return data;
}

export { schemas, validate, validateOrThrow, ValidationError };

export default {
  schemas,
  validate,
  validateOrThrow,
};

declare module "@auth/core/adapters" {
  export type JsonObject = {
    [Key in string]?: JsonValue;
  };
  export type JsonArray = JsonValue[];
  export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
} 
import type { CompilerOptions as NativeCompilerOptions } from "typescript/sync";

// Native path brands identify compiler-owned normalized paths. Project options
// are user input and must continue to accept ordinary path strings.
type InputOption<T> = T extends string ? string
  : T extends readonly (infer Item)[] ? InputOption<Item>[]
  : T extends object ? { [Key in keyof T]: InputOption<T[Key]> }
  : T;

export type CompilerOptions = { [Key in keyof NativeCompilerOptions]: InputOption<NativeCompilerOptions[Key]> };

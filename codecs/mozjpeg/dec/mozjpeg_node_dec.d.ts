export interface MOZJPEGModule extends EmscriptenWasm.Module {
  decode(data: BufferSource): ImageData | null;
}

declare var moduleFactory: EmscriptenWasm.ModuleFactory<MOZJPEGModule>;

export default moduleFactory;

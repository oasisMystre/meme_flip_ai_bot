export type Photo = {
  file_id: string;
  file_unique_id: string;
  file_size: number;
  width: number;
  height: number;
};

export type WebAppData<T> = {
  command: string,
  response: T,
}

export type ImageKit = {
  url: string,
  name: string,
}
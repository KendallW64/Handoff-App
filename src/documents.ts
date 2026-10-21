import type { Resource } from "./data";
export type UploadRecord = {
  id: string;
  handoffId: string;
  resource: Resource;
  original: Blob;
};
export const MAX_TEXT = 120000;
export const MAX_BINARY_BYTES = 3 * 1024 * 1024;
export const ACCEPT =
  ".pdf,.docx,.xlsx,.pptx,.txt,.md,.csv,.html,.htm,.rtf,.eml,.json,.xml,.log,.png,.jpg,.jpeg,.webp";
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("handoff-documents", 1);
    request.onupgradeneeded = () => {
      request.result
        .createObjectStore("documents", { keyPath: "id" })
        .createIndex("handoffId", "handoffId");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        new Error(
          "Browser file storage is unavailable. Check storage permissions.",
        ),
      );
  });
}
export async function listDocuments(
  handoffId: string,
): Promise<UploadRecord[]> {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const request = db
        .transaction("documents")
        .objectStore("documents")
        .index("handoffId")
        .getAll(handoffId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error("Could not read saved files."));
    });
  } finally {
    db.close();
  }
}
async function write(operation: (store: IDBObjectStore) => void) {
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("documents", "readwrite");
      operation(tx.objectStore("documents"));
      tx.oncomplete = () => resolve();
      tx.onerror = () =>
        reject(new Error("Could not save files. Browser storage may be full."));
      tx.onabort = () => reject(new Error("File storage was interrupted."));
    });
  } finally {
    db.close();
  }
}
export const putDocument = (record: UploadRecord) =>
  write((store) => store.put(record));
export const deleteDocument = (id: string) =>
  write((store) => store.delete(id));
export async function deleteHandoffDocuments(handoffId: string) {
  const db = await database();
  try {
    await new Promise<void>((resolve,reject)=>{
      const tx=db.transaction("documents","readwrite");
      const cursor=tx.objectStore("documents").index("handoffId").openCursor(IDBKeyRange.only(handoffId));
      cursor.onsuccess=()=>{const record=cursor.result;if(record){record.delete();record.continue();}};
      tx.oncomplete=()=>resolve();
      tx.onerror=tx.onabort=()=>reject(new Error("Could not delete this handoff's files. Nothing was removed from the handoff list."));
    });
  } finally {db.close();}
}
export function extractFile(file: File): Promise<Resource> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./extract.worker.ts", import.meta.url), {
      type: "module",
    });
    const finish = () => {
      clearTimeout(timer);
      worker.terminate();
    };
    const timer = setTimeout(() => {
      finish();
      reject(
        new Error(
          "This file took too long to read. Export a smaller file and try again.",
        ),
      );
    }, 30000);
    worker.onmessage = (e) => {
      finish();
      if (e.data.error) reject(new Error(e.data.error));
      else if (typeof e.data.text !== "string")
        reject(
          new Error(
            "The file reader returned invalid content. Please export the file again.",
          ),
        );
      else
        resolve({
          id: "upload_" + crypto.randomUUID(),
          title: file.name,
          category: "Uploaded file",
          origin: "upload",
          ...e.data,
        });
    };
    worker.onerror = () => {
      finish();
      reject(
        new Error(
          "This file could not be read. Try exporting it as PDF or text.",
        ),
      );
    };
    worker.postMessage(file);
  });
}
export function downloadOriginal(record: UploadRecord) {
  const url = URL.createObjectURL(record.original);
  const link = document.createElement("a");
  link.href = url;
  link.download = record.resource.title;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

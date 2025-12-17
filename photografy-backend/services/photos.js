import { parseRequest, uploadParseFile, encodeWhere, runBatch } from '../lib/parseClient.js';

const mapPhoto = (entry, index) => ({
  id: entry.objectId,
  filename: entry.photoId ?? entry.photoFile?.name ?? entry.objectId,
  originalName: entry.originalName ?? entry.photoId ?? entry.photoFile?.name ?? 'Foto sin título',
  url: entry.photoFile?.url ?? '',
  uploadedAt: entry.updatedAt ?? entry.createdAt,
  size: entry.fileSize ?? null,
  order: index,
});

const sortPhotoEntries = (entries) => {
  const sorted = [...entries].sort((a, b) => {
    const posA = Number.isFinite(a.position) ? a.position : Number.MAX_SAFE_INTEGER;
    const posB = Number.isFinite(b.position) ? b.position : Number.MAX_SAFE_INTEGER;
    if (posA !== posB) return posA - posB;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  let needsNormalization = false;
  sorted.forEach((item, index) => {
    if (!Number.isFinite(item.position) || item.position !== index) {
      needsNormalization = true;
    }
  });

  return { sorted, needsNormalization };
};

const listPhotos = async (folderKey) => {
  const where = encodeWhere({ folderKey });
  const data = await parseRequest(`/classes/PhotoOrder?where=${where}&order=position,createdAt&limit=1000`);
  const entries = Array.isArray(data?.results) ? data.results : [];

  const { sorted, needsNormalization } = sortPhotoEntries(entries);

  if (needsNormalization) {
    const requests = sorted.map((entry, index) => ({
      method: 'PUT',
      path: `/parse/classes/PhotoOrder/${entry.objectId}`,
      body: { position: index },
    }));
    await runBatch(requests);
    sorted.forEach((entry, index) => {
      entry.position = index;
    });
  }

  return sorted.map(mapPhoto);
};

const uploadPhotos = async (folderKey, files) => {
  const existing = await listPhotos(folderKey);
  let nextPosition = existing.length;

  for (const file of files) {
    const uploaded = await uploadParseFile(file);
    const body = {
      folderKey,
      photoId: uploaded.name,
      position: nextPosition,
      originalName: file.originalname,
      fileSize: file.size,
      photoFile: {
        __type: 'File',
        name: uploaded.name,
      },
    };
    nextPosition += 1;
    await parseRequest('/classes/PhotoOrder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  }

  return listPhotos(folderKey);
};

const deletePhoto = async (folderKey, photoId) => {
  await parseRequest(`/classes/PhotoOrder/${photoId}`, {
    method: 'DELETE',
  });
  return listPhotos(folderKey);
};

const updatePhotoOrder = async (folderKey, order) => {
  for (let index = 0; index < order.length; index += 1) {
    const objectId = order[index];
    await parseRequest(`/classes/PhotoOrder/${objectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ position: index }),
    });
  }
  return listPhotos(folderKey);
};

const deleteFolderPhotoOrders = async (folderKey) => {
  const where = encodeWhere({ folderKey });
  const data = await parseRequest(`/classes/PhotoOrder?where=${where}&limit=1000`);
  const entries = Array.isArray(data?.results) ? data.results : [];
  if (!entries.length) return;
  const requests = entries.map((entry) => ({
    method: 'DELETE',
    path: `/parse/classes/PhotoOrder/${entry.objectId}`,
  }));
  await runBatch(requests);
};

export {
  mapPhoto,
  listPhotos,
  uploadPhotos,
  deletePhoto,
  updatePhotoOrder,
  deleteFolderPhotoOrders,
};

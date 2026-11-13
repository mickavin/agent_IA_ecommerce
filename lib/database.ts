import Dexie, { Table } from 'dexie';

// Interface pour les données paginées
export interface PaginatedData<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Interface pour les options de pagination
export interface PaginationOptions {
  page: number;
  pageSize: number;
  searchTerm?: string;
  filters?: Record<string, any>;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

// Interface pour les données stockées
export interface StoredData {
  id?: number;
  data: any[];
  tableName: string;
  lastUpdated: Date;
}

class CsvDatabase extends Dexie {
  csvData!: Table<StoredData>;

  constructor() {
    super('CsvDatabase');
    this.version(1).stores({
      csvData: '++id, tableName, lastUpdated',
    });
  }
}

const db = new CsvDatabase();

// Fonctions existantes maintenues pour compatibilité
export async function saveToIndexedDB(data: any, tableName: string = 'products') {
  await db.csvData.where('tableName').equals(tableName).delete();
  await db.csvData.add({ 
    data, 
    tableName,
    lastUpdated: new Date()
  });
}

export async function getFromIndexedDB(tableName: string = 'products') {
  const result = await db.csvData.where('tableName').equals(tableName).first();
  return result?.data || [];
}

// Nouvelles fonctions de pagination

/**
 * Récupère les données avec pagination
 */
export async function getPaginatedData<T>(
  tableName: string,
  options: PaginationOptions
): Promise<PaginatedData<T>> {
  const { page, pageSize, searchTerm, filters, sortField, sortDirection } = options;
  
  // Récupérer toutes les données de la table
  const allData = await getFromIndexedDB(tableName);
  
  // Appliquer les filtres de recherche
  let filteredData = allData;
  
  if (searchTerm) {
    filteredData = allData.filter((item: any) => {
      const searchFields = ['name', 'product_title', 'title', 'customerName', 'customer_name'];
      return searchFields.some(field => 
        item[field]?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }
  
  // Appliquer les filtres supplémentaires
  if (filters) {
    filteredData = filteredData.filter((item: any) => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value || (Array.isArray(value) && value.length === 0)) return true;
        if (Array.isArray(value)) {
          return value.includes(item[key]);
        }
        return item[key] === value;
      });
    });
  }
  
  // Appliquer le tri
  if (sortField) {
    filteredData.sort((a: any, b: any) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }
  
  const total = filteredData.length;
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = filteredData.slice(startIndex, endIndex);
  
  return {
    data: paginatedData,
    total,
    page,
    pageSize,
    totalPages
  };
}

/**
 * Sauvegarde les données avec métadonnées
 */
export async function saveDataWithMetadata(
  data: any[],
  tableName: string,
  metadata?: Record<string, any>
): Promise<void> {
  await db.csvData.where('tableName').equals(tableName).delete();
  await db.csvData.add({
    data,
    tableName,
    lastUpdated: new Date(),
    ...metadata
  });
}

/**
 * Récupère les métadonnées d'une table
 */
export async function getTableMetadata(tableName: string): Promise<any> {
  const result = await db.csvData.where('tableName').equals(tableName).first();
  if (!result) return null;
  
  const { data, ...metadata } = result;
  return metadata;
}

/**
 * Compte le nombre total d'éléments dans une table
 */
export async function getTableCount(tableName: string): Promise<number> {
  const data = await getFromIndexedDB(tableName);
  return data.length;
}

/**
 * Recherche dans les données avec pagination
 */
export async function searchData<T>(
  tableName: string,
  searchTerm: string,
  searchFields: string[] = ['name', 'product_title', 'title'],
  options: Partial<PaginationOptions> = {}
): Promise<PaginatedData<T>> {
  const defaultOptions: PaginationOptions = {
    page: 1,
    pageSize: 10,
    searchTerm,
    ...options
  };
  
  return getPaginatedData<T>(tableName, defaultOptions);
}

/**
 * Efface toutes les données d'une table
 */
export async function clearTable(tableName: string): Promise<void> {
  await db.csvData.where('tableName').equals(tableName).delete();
}

/**
 * Liste toutes les tables disponibles
 */
export async function getAllTables(): Promise<string[]> {
  const allData = await db.csvData.toArray();
  return [...new Set(allData.map(item => item.tableName))];
}

/**
 * Exporte les données d'une table au format JSON
 */
export async function exportTableData(tableName: string): Promise<any[]> {
  return await getFromIndexedDB(tableName);
}

/**
 * Importe des données dans une table depuis un tableau JSON
 */
export async function importTableData(
  tableName: string,
  data: any[],
  replaceExisting: boolean = true
): Promise<void> {
  if (replaceExisting) {
    await clearTable(tableName);
  }
  
  const existingData = replaceExisting ? [] : await getFromIndexedDB(tableName);
  const mergedData = [...existingData, ...data];
  
  await saveToIndexedDB(mergedData, tableName);
}
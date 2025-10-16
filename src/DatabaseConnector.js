/**
 * DATABASE CONNECTOR MODULE
 * 
 * PURPOSE:
 * Provides a unified abstraction layer for database operations across Firebase and Supabase.
 * Allows dynamic switching between providers via configuration without changing app code.
 * 
 * ARCHITECTURE:
 * - Single entry point: createConnector(config)
 * - Provider-agnostic interface for auth and database operations
 * - Normalized error handling across providers
 * - Real-time subscription support for both platforms
 * 
 * USAGE:
 * const connector = createConnector({ provider: 'firebase', firebaseConfig: {...} });
 * const { auth, db } = await connector.connect();
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, onSnapshot, deleteDoc, updateDoc } from 'firebase/firestore';
import { createClient } from '@supabase/supabase-js';

/**
 * Normalized error structure for consistent error handling
 * @typedef {Object} ConnectorError
 * @property {string} code - Error code
 * @property {string} message - Human-readable error message
 * @property {string} provider - Provider that generated the error
 * @property {Object} context - Additional context about the error
 */

/**
 * Configuration object for the connector
 * @typedef {Object} ConnectorConfig
 * @property {'firebase'|'supabase'} provider - Database provider to use
 * @property {Object} [firebaseConfig] - Firebase configuration object
 * @property {Object} [supabaseConfig] - Supabase configuration object
 * @property {string} [supabaseConfig.url] - Supabase project URL
 * @property {string} [supabaseConfig.anonKey] - Supabase anonymous key
 */

/**
 * Creates a normalized error object
 * @param {string} code - Error code
 * @param {string} message - Error message
 * @param {string} provider - Provider name
 * @param {Object} context - Additional context
 * @returns {ConnectorError}
 */
const createError = (code, message, provider, context = {}) => ({
  code,
  message,
  provider,
  context,
  timestamp: new Date().toISOString()
});

/**
 * Firebase Provider Implementation
 */
class FirebaseProvider {
  constructor(config) {
    this.config = config;
    this.app = null;
    this.auth = null;
    this.db = null;
  }

  /**
   * Initialize Firebase connection
   */
  async connect() {
    try {
      this.app = initializeApp(this.config);
      this.auth = getAuth(this.app);
      this.db = getFirestore(this.app);
      
      // Wait for auth state to be ready
      await new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(this.auth, (user) => {
          unsubscribe();
          resolve(user);
        });
      });

      console.log('✅ Firebase connected successfully');
    } catch (error) {
      throw createError(
        'FIREBASE_CONNECT_ERROR',
        `Failed to connect to Firebase: ${error.message}`,
        'firebase',
        { originalError: error }
      );
    }
  }

  /**
   * Sign in anonymously
   */
  async signIn() {
    try {
      const result = await signInAnonymously(this.auth);
      sessionStorage.setItem('firebase_token', await result.user.getIdToken());
      return { user: result.user, token: await result.user.getIdToken() };
    } catch (error) {
      throw createError(
        'FIREBASE_AUTH_ERROR',
        `Firebase authentication failed: ${error.message}`,
        'firebase',
        { originalError: error }
      );
    }
  }

  /**
   * Sign out
   */
  async signOut() {
    try {
      await firebaseSignOut(this.auth);
      sessionStorage.removeItem('firebase_token');
    } catch (error) {
      throw createError(
        'FIREBASE_SIGNOUT_ERROR',
        `Firebase sign out failed: ${error.message}`,
        'firebase',
        { originalError: error }
      );
    }
  }

  /**
   * Get current user
   */
  currentUser() {
    return this.auth.currentUser;
  }

  /**
   * Read documents from a collection
   * @param {string} collectionPath - Path to collection
   * @param {Object} queryOptions - Query options (where, limit, orderBy)
   */
  async read(collectionPath, queryOptions = {}) {
    try {
      const collectionRef = collection(this.db, collectionPath);
      let q = collectionRef;

      if (queryOptions.where) {
        const [field, operator, value] = queryOptions.where;
        q = query(q, where(field, operator, value));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw createError(
        'FIREBASE_READ_ERROR',
        `Failed to read from ${collectionPath}: ${error.message}`,
        'firebase',
        { collectionPath, queryOptions, originalError: error }
      );
    }
  }

  /**
   * Write a document
   * @param {string} collectionPath - Path to collection
   * @param {string} docId - Document ID
   * @param {Object} data - Data to write
   */
  async write(collectionPath, docId, data) {
    try {
      const docRef = doc(this.db, collectionPath, docId);
      await setDoc(docRef, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
      return { id: docId, ...data };
    } catch (error) {
      throw createError(
        'FIREBASE_WRITE_ERROR',
        `Failed to write to ${collectionPath}/${docId}: ${error.message}`,
        'firebase',
        { collectionPath, docId, originalError: error }
      );
    }
  }

  /**
   * Update a document
   */
  async update(collectionPath, docId, data) {
    try {
      const docRef = doc(this.db, collectionPath, docId);
      await updateDoc(docRef, { ...data, updatedAt: new Date().toISOString() });
      return { id: docId, ...data };
    } catch (error) {
      throw createError(
        'FIREBASE_UPDATE_ERROR',
        `Failed to update ${collectionPath}/${docId}: ${error.message}`,
        'firebase',
        { collectionPath, docId, originalError: error }
      );
    }
  }

  /**
   * Delete a document
   */
  async delete(collectionPath, docId) {
    try {
      const docRef = doc(this.db, collectionPath, docId);
      await deleteDoc(docRef);
      return { id: docId, deleted: true };
    } catch (error) {
      throw createError(
        'FIREBASE_DELETE_ERROR',
        `Failed to delete ${collectionPath}/${docId}: ${error.message}`,
        'firebase',
        { collectionPath, docId, originalError: error }
      );
    }
  }

  /**
   * Subscribe to real-time updates
   * @param {string} collectionPath - Path to collection
   * @param {Function} callback - Callback function for updates
   * @returns {Function} Unsubscribe function
   */
  onSnapshot(collectionPath, callback) {
    try {
      const collectionRef = collection(this.db, collectionPath);
      return onSnapshot(collectionRef, 
        (snapshot) => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          callback(data, null);
        },
        (error) => {
          callback(null, createError(
            'FIREBASE_SNAPSHOT_ERROR',
            `Snapshot error on ${collectionPath}: ${error.message}`,
            'firebase',
            { collectionPath, originalError: error }
          ));
        }
      );
    } catch (error) {
      throw createError(
        'FIREBASE_SNAPSHOT_SETUP_ERROR',
        `Failed to setup snapshot for ${collectionPath}: ${error.message}`,
        'firebase',
        { collectionPath, originalError: error }
      );
    }
  }
}

/**
 * Supabase Provider Implementation
 */
class SupabaseProvider {
  constructor(config) {
    this.config = config;
    this.client = null;
  }

  /**
   * Initialize Supabase connection
   */
  async connect() {
    try {
      this.client = createClient(this.config.url, this.config.anonKey);
      console.log('✅ Supabase connected successfully');
    } catch (error) {
      throw createError(
        'SUPABASE_CONNECT_ERROR',
        `Failed to connect to Supabase: ${error.message}`,
        'supabase',
        { originalError: error }
      );
    }
  }

  /**
   * Sign in with anonymous authentication
   */
  async signIn() {
    try {
      const { data, error } = await this.client.auth.signInAnonymously();
      if (error) throw error;
      
      sessionStorage.setItem('supabase_token', data.session.access_token);
      return { user: data.user, token: data.session.access_token };
    } catch (error) {
      throw createError(
        'SUPABASE_AUTH_ERROR',
        `Supabase authentication failed: ${error.message}`,
        'supabase',
        { originalError: error }
      );
    }
  }

  /**
   * Sign out
   */
  async signOut() {
    try {
      await this.client.auth.signOut();
      sessionStorage.removeItem('supabase_token');
    } catch (error) {
      throw createError(
        'SUPABASE_SIGNOUT_ERROR',
        `Supabase sign out failed: ${error.message}`,
        'supabase',
        { originalError: error }
      );
    }
  }

  /**
   * Get current user
   */
  async currentUser() {
    const { data: { user } } = await this.client.auth.getUser();
    return user;
  }

  /**
   * Read documents from a table
   */
  async read(tableName, queryOptions = {}) {
    try {
      let query = this.client.from(tableName).select('*');

      if (queryOptions.where) {
        const [field, operator, value] = queryOptions.where;
        switch (operator) {
          case '==':
            query = query.eq(field, value);
            break;
          case '>':
            query = query.gt(field, value);
            break;
          case '<':
            query = query.lt(field, value);
            break;
          case '>=':
            query = query.gte(field, value);
            break;
          case '<=':
            query = query.lte(field, value);
            break;
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return data;
    } catch (error) {
      throw createError(
        'SUPABASE_READ_ERROR',
        `Failed to read from ${tableName}: ${error.message}`,
        'supabase',
        { tableName, queryOptions, originalError: error }
      );
    }
  }

  /**
   * Write a document
   */
  async write(tableName, docId, data) {
    try {
      const { data: result, error } = await this.client
        .from(tableName)
        .upsert({ id: docId, ...data, updated_at: new Date().toISOString() });
      
      if (error) throw error;
      return result;
    } catch (error) {
      throw createError(
        'SUPABASE_WRITE_ERROR',
        `Failed to write to ${tableName}: ${error.message}`,
        'supabase',
        { tableName, docId, originalError: error }
      );
    }
  }

  /**
   * Update a document
   */
  async update(tableName, docId, data) {
    try {
      const { data: result, error } = await this.client
        .from(tableName)
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', docId);
      
      if (error) throw error;
      return result;
    } catch (error) {
      throw createError(
        'SUPABASE_UPDATE_ERROR',
        `Failed to update ${tableName}: ${error.message}`,
        'supabase',
        { tableName, docId, originalError: error }
      );
    }
  }

  /**
   * Delete a document
   */
  async delete(tableName, docId) {
    try {
      const { error } = await this.client
        .from(tableName)
        .delete()
        .eq('id', docId);
      
      if (error) throw error;
      return { id: docId, deleted: true };
    } catch (error) {
      throw createError(
        'SUPABASE_DELETE_ERROR',
        `Failed to delete from ${tableName}: ${error.message}`,
        'supabase',
        { tableName, docId, originalError: error }
      );
    }
  }

  /**
   * Subscribe to real-time updates
   */
  onSnapshot(tableName, callback) {
    try {
      const channel = this.client
        .channel(`${tableName}_changes`)
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: tableName },
          (payload) => {
            // Fetch all data when changes occur
            this.read(tableName).then(data => callback(data, null)).catch(error => callback(null, error));
          }
        )
        .subscribe();

      // Return unsubscribe function
      return () => {
        this.client.removeChannel(channel);
      };
    } catch (error) {
      throw createError(
        'SUPABASE_SNAPSHOT_ERROR',
        `Failed to setup snapshot for ${tableName}: ${error.message}`,
        'supabase',
        { tableName, originalError: error }
      );
    }
  }
}

/**
 * Azure Cosmos DB Provider Implementation
 */
class AzureProvider {
  constructor(config) {
    this.config = config;
    this.endpoint = config.endpoint;
    this.key = config.key;
    this.databaseId = config.databaseId || 'FineGuardDB';
    this.authenticated = false;
  }

  /**
   * Initialize Azure Cosmos DB connection
   */
  async connect() {
    try {
      // Azure Cosmos DB uses REST API
      // Validate connection by attempting to list containers
      const response = await fetch(`${this.endpoint}/dbs/${this.databaseId}/colls`, {
        method: 'GET',
        headers: {
          'Authorization': this.key,
          'x-ms-version': '2018-12-31',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Azure connection failed: ${response.statusText}`);
      }

      this.authenticated = true;
      console.log('✅ Azure Cosmos DB connected successfully');
    } catch (error) {
      throw createError(
        'AZURE_CONNECT_ERROR',
        `Failed to connect to Azure Cosmos DB: ${error.message}`,
        'azure',
        { originalError: error }
      );
    }
  }

  /**
   * Sign in (Azure uses key-based auth, so this is a no-op)
   */
  async signIn() {
    try {
      sessionStorage.setItem('azure_token', this.key);
      return { user: { id: 'azure-user' }, token: this.key };
    } catch (error) {
      throw createError(
        'AZURE_AUTH_ERROR',
        `Azure authentication failed: ${error.message}`,
        'azure',
        { originalError: error }
      );
    }
  }

  /**
   * Sign out
   */
  async signOut() {
    sessionStorage.removeItem('azure_token');
    this.authenticated = false;
  }

  /**
   * Get current user
   */
  currentUser() {
    return this.authenticated ? { id: 'azure-user' } : null;
  }

  /**
   * Read documents from a container
   */
  async read(containerName, queryOptions = {}) {
    try {
      let query = `SELECT * FROM c`;
      
      if (queryOptions.where) {
        const [field, operator, value] = queryOptions.where;
        const sqlOperator = operator === '==' ? '=' : operator;
        const formattedValue = typeof value === 'string' ? `"${value}"` : value;
        query += ` WHERE c.${field} ${sqlOperator} ${formattedValue}`;
      }

      const response = await fetch(`${this.endpoint}/dbs/${this.databaseId}/colls/${containerName}/docs`, {
        method: 'POST',
        headers: {
          'Authorization': this.key,
          'x-ms-version': '2018-12-31',
          'Content-Type': 'application/query+json',
          'x-ms-documentdb-isquery': 'true'
        },
        body: JSON.stringify({ query })
      });

      if (!response.ok) {
        throw new Error(`Read failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.Documents || [];
    } catch (error) {
      throw createError(
        'AZURE_READ_ERROR',
        `Failed to read from ${containerName}: ${error.message}`,
        'azure',
        { containerName, queryOptions, originalError: error }
      );
    }
  }

  /**
   * Write a document
   */
  async write(containerName, docId, data) {
    try {
      const response = await fetch(`${this.endpoint}/dbs/${this.databaseId}/colls/${containerName}/docs`, {
        method: 'POST',
        headers: {
          'Authorization': this.key,
          'x-ms-version': '2018-12-31',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: docId, ...data, _updatedAt: new Date().toISOString() })
      });

      if (!response.ok) {
        throw new Error(`Write failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw createError(
        'AZURE_WRITE_ERROR',
        `Failed to write to ${containerName}: ${error.message}`,
        'azure',
        { containerName, docId, originalError: error }
      );
    }
  }

  /**
   * Update a document
   */
  async update(containerName, docId, data) {
    try {
      // Azure requires replace operation
      const existing = await this.read(containerName, { where: ['id', '==', docId] });
      if (!existing || existing.length === 0) {
        throw new Error('Document not found');
      }

      const response = await fetch(`${this.endpoint}/dbs/${this.databaseId}/colls/${containerName}/docs/${docId}`, {
        method: 'PUT',
        headers: {
          'Authorization': this.key,
          'x-ms-version': '2018-12-31',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...existing[0], ...data, _updatedAt: new Date().toISOString() })
      });

      if (!response.ok) {
        throw new Error(`Update failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw createError(
        'AZURE_UPDATE_ERROR',
        `Failed to update ${containerName}: ${error.message}`,
        'azure',
        { containerName, docId, originalError: error }
      );
    }
  }

  /**
   * Delete a document
   */
  async delete(containerName, docId) {
    try {
      const response = await fetch(`${this.endpoint}/dbs/${this.databaseId}/colls/${containerName}/docs/${docId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': this.key,
          'x-ms-version': '2018-12-31'
        }
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.statusText}`);
      }

      return { id: docId, deleted: true };
    } catch (error) {
      throw createError(
        'AZURE_DELETE_ERROR',
        `Failed to delete from ${containerName}: ${error.message}`,
        'azure',
        { containerName, docId, originalError: error }
      );
    }
  }

  /**
   * Subscribe to real-time updates (Azure uses Change Feed)
   */
  onSnapshot(containerName, callback) {
    // Azure Cosmos DB Change Feed requires polling
    const interval = setInterval(async () => {
      try {
        const data = await this.read(containerName);
        callback(data, null);
      } catch (error) {
        callback(null, error);
      }
    }, 5000); // Poll every 5 seconds

    // Return unsubscribe function
    return () => clearInterval(interval);
  }
}

/**
 * Main Connector Factory
 * Creates a unified database connector based on configuration
 * 
 * @param {ConnectorConfig} config - Configuration object
 * @returns {Object} Connector interface
 */
export const createConnector = (config) => {
  let provider;

  // Validate configuration
  if (!config || !config.provider) {
    throw createError(
      'INVALID_CONFIG',
      'Configuration must include a provider field',
      'connector',
      { config }
    );
  }

  // Initialize appropriate provider
  switch (config.provider) {
    case 'firebase':
      if (!config.firebaseConfig) {
        throw createError(
          'INVALID_CONFIG',
          'Firebase provider requires firebaseConfig',
          'connector',
          { config }
        );
      }
      provider = new FirebaseProvider(config.firebaseConfig);
      break;

    case 'supabase':
      if (!config.supabaseConfig) {
        throw createError(
          'INVALID_CONFIG',
          'Supabase provider requires supabaseConfig',
          'connector',
          { config }
        );
      }
      provider = new SupabaseProvider(config.supabaseConfig);
      break;

    case 'azure':
      if (!config.azureConfig) {
        throw createError(
          'INVALID_CONFIG',
          'Azure provider requires azureConfig',
          'connector',
          { config }
        );
      }
      provider = new AzureProvider(config.azureConfig);
      break;

    default:
      throw createError(
        'UNSUPPORTED_PROVIDER',
        `Provider "${config.provider}" is not supported`,
        'connector',
        { config }
      );
  }

  // Return unified interface
  return {
    /**
     * Connect to the database
     */
    async connect() {
      await provider.connect();
      return {
        auth: {
          signIn: () => provider.signIn(),
          signOut: () => provider.signOut(),
          currentUser: () => provider.currentUser()
        },
        db: {
          read: (path, options) => provider.read(path, options),
          write: (path, id, data) => provider.write(path, id, data),
          update: (path, id, data) => provider.update(path, id, data),
          delete: (path, id) => provider.delete(path, id),
          onSnapshot: (path, callback) => provider.onSnapshot(path, callback)
        }
      };
    },

    /**
     * Get provider name
     */
    getProvider() {
      return config.provider;
    }
  };
};

/**
 * EXAMPLE USAGE:
 * 
 * // Firebase Example:
 * const firebaseConnector = createConnector({
 *   provider: 'firebase',
 *   firebaseConfig: {
 *     apiKey: "your-api-key",
 *     authDomain: "your-app.firebaseapp.com",
 *     projectId: "your-project-id"
 *   }
 * });
 * 
 * const { auth, db } = await firebaseConnector.connect();
 * await auth.signIn();
 * const companies = await db.read('companies');
 * 
 * // Supabase Example:
 * const supabaseConnector = createConnector({
 *   provider: 'supabase',
 *   supabaseConfig: {
 *     url: 'https://your-project.supabase.co',
 *     anonKey: 'your-anon-key'
 *   }
 * });
 * 
 * const { auth, db } = await supabaseConnector.connect();
 * await auth.signIn();
 * const companies = await db.read('companies');
 */


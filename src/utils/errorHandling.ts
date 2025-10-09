// src/utils/errorHandling.ts

/**
 * Custom Error Classes for SafeGuard Application
 */

export class SafeGuardError extends Error {
    constructor(
      message: string,
      public code: string,
      public statusCode: number = 500
    ) {
      super(message);
      this.name = 'SafeGuardError';
    }
  }
  
  export class AuthenticationError extends SafeGuardError {
    constructor(message: string, code: string = 'AUTH_ERROR') {
      super(message, code, 401);
      this.name = 'AuthenticationError';
    }
  }
  
  export class ValidationError extends SafeGuardError {
    constructor(message: string, code: string = 'VALIDATION_ERROR') {
      super(message, code, 400);
      this.name = 'ValidationError';
    }
  }
  
  export class PermissionError extends SafeGuardError {
    constructor(message: string, code: string = 'PERMISSION_ERROR') {
      super(message, code, 403);
      this.name = 'PermissionError';
    }
  }
  
  export class NetworkError extends SafeGuardError {
    constructor(message: string, code: string = 'NETWORK_ERROR') {
      super(message, code, 503);
      this.name = 'NetworkError';
    }
  }
  
  /**
   * Error Handler Utility
   */
  export class ErrorHandler {
    private static logError(error: Error, context?: string): void {
      console.error(`[SafeGuard Error]${context ? ` ${context}:` : ''}`, error);
      
      // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
      // if (import.meta.env.PROD) {
      //   Sentry.captureException(error, { tags: { context } });
      // }
    }
  
    static handle(error: unknown, context?: string): string {
      this.logError(error as Error, context);
  
      if (error instanceof SafeGuardError) {
        return error.message;
      }
  
      if (error instanceof Error) {
        return error.message;
      }
  
      return 'An unexpected error occurred. Please try again.';
    }
  
    static async withErrorHandling<T>(
      fn: () => Promise<T>,
      context?: string
    ): Promise<T> {
      try {
        return await fn();
      } catch (error) {
        const message = this.handle(error, context);
        throw new Error(message);
      }
    }
  }
  
  /**
   * Validation Utilities
   */
  export class Validator {
    static isValidEmail(email: string): boolean {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    }
  
    static isValidPhone(phone: string): boolean {
      // E.164 format: +[country code][number]
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      return phoneRegex.test(phone);
    }
  
    static isValidPassword(password: string): {
      valid: boolean;
      errors: string[];
    } {
      const errors: string[] = [];
  
      if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
      }
      if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
      }
      if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
      }
      if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
      }
      if (!/[!@#$%^&*]/.test(password)) {
        errors.push('Password must contain at least one special character (!@#$%^&*)');
      }
  
      return {
        valid: errors.length === 0,
        errors
      };
    }
  
    static sanitizeInput(input: string): string {
      return input.trim().replace(/[<>]/g, '');
    }
  
    static validateCoordinates(lat: number, lon: number): boolean {
      return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
    }
  }
  
  /**
   * Retry Logic for Network Requests
   */
  export class RetryHandler {
    static async retry<T>(
      fn: () => Promise<T>,
      maxRetries: number = 3,
      delayMs: number = 1000
    ): Promise<T> {
      let lastError: Error;
  
      for (let i = 0; i < maxRetries; i++) {
        try {
          return await fn();
        } catch (error) {
          lastError = error as Error;
          
          if (i < maxRetries - 1) {
            await this.delay(delayMs * Math.pow(2, i)); // Exponential backoff
          }
        }
      }
  
      throw new NetworkError(
        `Failed after ${maxRetries} attempts: ${lastError!.message}`,
        'RETRY_EXHAUSTED'
      );
    }
  
    private static delay(ms: number): Promise<void> {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  }
  
  /**
   * Rate Limiting Utility
   */
  export class RateLimiter {
    private attempts = new Map<string, number[]>();
  
    constructor(
      private maxAttempts: number = 5,
      private windowMs: number = 60000 // 1 minute
    ) {}
  
    canAttempt(key: string): boolean {
      const now = Date.now();
      const attempts = this.attempts.get(key) || [];
      
      // Remove old attempts outside the window
      const recentAttempts = attempts.filter(
        timestamp => now - timestamp < this.windowMs
      );
      
      this.attempts.set(key, recentAttempts);
      
      return recentAttempts.length < this.maxAttempts;
    }
  
    recordAttempt(key: string): void {
      const attempts = this.attempts.get(key) || [];
      attempts.push(Date.now());
      this.attempts.set(key, attempts);
    }
  
    getRemainingAttempts(key: string): number {
      const now = Date.now();
      const attempts = this.attempts.get(key) || [];
      const recentAttempts = attempts.filter(
        timestamp => now - timestamp < this.windowMs
      );
      
      return Math.max(0, this.maxAttempts - recentAttempts.length);
    }
  
    reset(key: string): void {
      this.attempts.delete(key);
    }
  }
  
  /**
   * Security Utilities
   */
  export class SecurityUtils {
    // Sanitize user input to prevent XSS
    static sanitizeHTML(html: string): string {
      const div = document.createElement('div');
      div.textContent = html;
      return div.innerHTML;
    }
  
    // Generate secure random string
    static generateSecureToken(length: number = 32): string {
      const array = new Uint8Array(length);
      crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
  
    // Check if connection is secure (HTTPS)
    static isSecureConnection(): boolean {
      return window.location.protocol === 'https:' || 
             window.location.hostname === 'localhost';
    }
  
    // Validate file upload
    static validateFile(
      file: File,
      allowedTypes: string[],
      maxSizeMB: number
    ): { valid: boolean; error?: string } {
      // Check file type
      if (!allowedTypes.includes(file.type)) {
        return {
          valid: false,
          error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
        };
      }
  
      // Check file size
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        return {
          valid: false,
          error: `File size exceeds ${maxSizeMB}MB limit`
        };
      }
  
      return { valid: true };
    }
  }
  
  /**
   * Performance Monitoring
   */
  export class PerformanceMonitor {
    private static marks = new Map<string, number>();
  
    static start(label: string): void {
      this.marks.set(label, performance.now());
    }
  
    static end(label: string): number | null {
      const startTime = this.marks.get(label);
      if (!startTime) return null;
  
      const duration = performance.now() - startTime;
      this.marks.delete(label);
  
      console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
      
      // TODO: Send to analytics service
      
      return duration;
    }
  
    static async measure<T>(label: string, fn: () => Promise<T>): Promise<T> {
      this.start(label);
      try {
        const result = await fn();
        this.end(label);
        return result;
      } catch (error) {
        this.end(label);
        throw error;
      }
    }
  }
  
  /**
   * Network Status Monitor
   */
  export class NetworkMonitor {
    private static listeners: ((isOnline: boolean) => void)[] = [];
  
    static initialize(): void {
      window.addEventListener('online', () => this.notifyListeners(true));
      window.addEventListener('offline', () => this.notifyListeners(false));
    }
  
    static isOnline(): boolean {
      return navigator.onLine;
    }
  
    static addListener(callback: (isOnline: boolean) => void): () => void {
      this.listeners.push(callback);
      
      // Return unsubscribe function
      return () => {
        this.listeners = this.listeners.filter(cb => cb !== callback);
      };
    }
  
    private static notifyListeners(isOnline: boolean): void {
      this.listeners.forEach(callback => callback(isOnline));
    }
  }
  
  /**
   * Storage Utilities with Encryption
   */
  export class SecureStorage {
    private static encryptionKey: string | null = null;
  
    static setEncryptionKey(key: string): void {
      this.encryptionKey = key;
    }
  
    static setItem(key: string, value: any): void {
      try {
        const serialized = JSON.stringify(value);
        const encrypted = this.encrypt(serialized);
        localStorage.setItem(key, encrypted);
      } catch (error) {
        console.error('Error saving to storage:', error);
      }
    }
  
    static getItem<T>(key: string): T | null {
      try {
        const encrypted = localStorage.getItem(key);
        if (!encrypted) return null;
  
        const decrypted = this.decrypt(encrypted);
        return JSON.parse(decrypted) as T;
      } catch (error) {
        console.error('Error reading from storage:', error);
        return null;
      }
    }
  
    static removeItem(key: string): void {
      localStorage.removeItem(key);
    }
  
    static clear(): void {
      localStorage.clear();
    }
  
    // Simple XOR encryption (for demo - use proper encryption in production)
    private static encrypt(text: string): string {
      if (!this.encryptionKey) return btoa(text);
      
      let result = '';
      for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(
          text.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length)
        );
      }
      return btoa(result);
    }
  
    private static decrypt(encrypted: string): string {
      if (!this.encryptionKey) return atob(encrypted);
      
      const decoded = atob(encrypted);
      let result = '';
      for (let i = 0; i < decoded.length; i++) {
        result += String.fromCharCode(
          decoded.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length)
        );
      }
      return result;
    }
  }
  
  /**
   * Debounce and Throttle Utilities
   */
  export function debounce<T extends (...args: any[]) => any>(
    func: T,
    waitMs: number
  ): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout>;
    
    return function executedFunction(...args: Parameters<T>) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), waitMs);
    };
  }
  
  export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limitMs: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return function executedFunction(...args: Parameters<T>) {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limitMs);
      }
    };
  }
  
  /**
   * Usage Example:
   * 
   * // Error Handling
   * try {
   *   await authService.signUpWithEmail(email, password, name);
   * } catch (error) {
   *   const message = ErrorHandler.handle(error, 'Sign Up');
   *   showNotification(message);
   * }
   * 
   * // Validation
   * if (!Validator.isValidEmail(email)) {
   *   throw new ValidationError('Invalid email format');
   * }
   * 
   * // Retry Logic
   * const data = await RetryHandler.retry(
   *   () => fetchDataFromAPI(),
   *   3,
   *   1000
   * );
   * 
   * // Rate Limiting
   * const limiter = new RateLimiter(5, 60000);
   * if (!limiter.canAttempt('login')) {
   *   throw new Error('Too many attempts. Please try again later.');
   * }
   * limiter.recordAttempt('login');
   * 
   * // Performance Monitoring
   * await PerformanceMonitor.measure('fetchIncidents', async () => {
   *   return await incidentService.getUserIncidents();
   * });
   * 
   * // Network Monitoring
   * NetworkMonitor.initialize();
   * NetworkMonitor.addListener((isOnline) => {
   *   if (!isOnline) {
   *     showOfflineNotification();
   *   }
   * });
   */
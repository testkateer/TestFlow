const { chromium } = require('playwright');

class PlaywrightTestRunner {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async initializeBrowser() {
    this.browser = await chromium.launch({ headless: false });
    this.page = await this.browser.newPage();
  }

  async executestep(step) {
    if (!this.page) {
      await this.initializeBrowser();
    }

    switch (step.type) {
      case 'navigate':
        return await this.navigateToUrl(step.config.url);
      case 'click':
        return await this.clickElement(step.config.selector);
      case 'input':
        return await this.fillInput(step.config.selector, step.config.text);
      case 'wait':
        return await this.waitForDuration(step.config.duration);
      case 'verify':
        return await this.verifyElement(step.config.selector);
      case 'refresh':
        return await this.refreshPage();
      default:
        throw new Error(`Desteklenmeyen adım türü: ${step.type}`);
    }
  }

  async navigateToUrl(url) {
    try {
      if (!url) {
        throw new Error('URL boş olamaz');
      }
      
      // URL'nin http/https ile başlayıp başlamadığını kontrol et
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      await this.page.goto(url, { waitUntil: 'networkidle' });
      
      return {
        success: true,
        message: `${url} adresine başarıyla yönlendirildi`,
        url: url
      };
    } catch (error) {
      return {
        success: false,
        message: `Yönlendirme hatası: ${error.message}`,
        error: error.message
      };
    }
  }

  async clickElement(selector) {
    try {
      await this.page.click(selector);
      return {
        success: true,
        message: `Element tıklandı: ${selector}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Tıklama hatası: ${error.message}`,
        error: error.message
      };
    }
  }

  async fillInput(selector, text) {
    try {
      await this.page.fill(selector, text);
      return {
        success: true,
        message: `Metin girildi: ${text}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Metin girme hatası: ${error.message}`,
        error: error.message
      };
    }
  }

  async waitForDuration(duration) {
    try {
      await this.page.waitForTimeout(duration);
      return {
        success: true,
        message: `${duration}ms beklendi`
      };
    } catch (error) {
      return {
        success: false,
        message: `Bekleme hatası: ${error.message}`,
        error: error.message
      };
    }
  }

  async verifyElement(selector) {
    try {
      await this.page.waitForSelector(selector, { timeout: 10000 });
      return {
        success: true,
        message: `Element doğrulandı: ${selector}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Doğrulama hatası: ${error.message}`,
        error: error.message
      };
    }
  }

  async refreshPage() {
    try {
      await this.page.reload();
      return {
        success: true,
        message: 'Sayfa yenilendi'
      };
    } catch (error) {
      return {
        success: false,
        message: `Yenileme hatası: ${error.message}`,
        error: error.message
      };
    }
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }

  async runTestSequence(steps) {
    const results = [];
    
    try {
      await this.initializeBrowser();
      
      for (const step of steps) {
        const result = await this.executestep(step);
        results.push({
          step: step,
          result: result,
          timestamp: new Date().toISOString()
        });
        
        // Eğer adım başarısız olursa durabilir
        if (!result.success) {
          console.error(`Adım başarısız: ${step.name}`, result.message);
          // İsteğe bağlı: Hata durumunda test dizisini durdur
          // break;
        }
      }
      
      return {
        success: true,
        results: results,
        totalSteps: steps.length,
        successfulSteps: results.filter(r => r.result.success).length
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        results: results
      };
    }
  }
}

module.exports = PlaywrightTestRunner; 
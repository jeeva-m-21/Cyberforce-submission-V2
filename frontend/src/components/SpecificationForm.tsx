import React, { useState, useEffect, useRef } from 'react';
import { useGeneratorStore } from '../store/generatorStore';
import { apiClient, ModuleConfig } from '../api/client';
import { Button, Input, Select, Card } from './ui';
import toast from 'react-hot-toast';
import { FiUpload, FiDownload, FiPlus, FiTrash2, FiCpu, FiSettings } from 'react-icons/fi';

export const SpecificationForm: React.FC<{ onSubmit: (spec: any) => void }> = ({ onSubmit }) => {
  const { specification, setSpecification, addModule, removeModule, updateModule } = useGeneratorStore();
  const [templates, setTemplates] = useState<Record<string, any>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [apiBaseUrl, setApiBaseUrl] = useState<string>(() => localStorage.getItem('apiBaseUrl') || '/api');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await apiClient.getTemplates();
      setTemplates(data);
    } catch (error) {
      toast.error('Failed to load templates');
    }
  };

  const handleLoadTemplate = (templateName: string) => {
    const template = templates[templateName];
    if (template) {
      setSpecification({
        project_name: template.project_name || templateName,
        description: template.description || '',
        mcu: template.target_platform || 'STM32F103',
        modules: template.modules || [],
        constraints: template.constraints || {},
        requirements: template.requirements || [],
        safety_critical: template.safety_critical || false,
        optimization_goal: template.optimization_goal || 'balanced',
        model_provider: template.model_provider || 'mock',
        model_name: template.model_name || '',
        api_key: template.api_key || '',
        architecture_only: template.architecture_only || false
      });
      toast.success(`Loaded template: ${templateName}`);
    }
  };

  const handleUploadJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setUploadStatus('No file selected');
      return;
    }

    setUploadStatus(`Loading ${file.name}...`);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const fileContent = event.target?.result as string;
        console.log('File content:', fileContent.substring(0, 200));
        
        const json = JSON.parse(fileContent);
        console.log('Parsed JSON successfully:', json);
        
        // Validate required fields with detailed messages
        const errors: string[] = [];
        
        if (!json.project_name || typeof json.project_name !== 'string') {
          errors.push('project_name (string)');
        }
        
        if (!json.target_platform && !json.mcu) {
          errors.push('target_platform or mcu');
        }
        
        if (!Array.isArray(json.modules)) {
          errors.push('modules (array)');
        }
        
        if (errors.length > 0) {
          throw new Error(`Missing required fields: ${errors.join(', ')}`);
        }

        const moduleCount = json.modules.length;
        
        const newSpec = {
          project_name: json.project_name,
          description: json.description || '',
          mcu: json.target_platform || json.mcu || 'STM32F103',
          modules: json.modules.map((m: any) => ({
            name: m.name || 'Unnamed Module',
            type: m.type || '',
            description: m.description || '',
            parameters: m.parameters || {}
          })),
          constraints: json.constraints || {},
          requirements: Array.isArray(json.requirements) ? json.requirements : [],
          safety_critical: json.safety_critical || false,
          optimization_goal: json.optimization_goal || 'balanced',
          model_provider: json.model_provider || 'mock',
          model_name: json.model_name || '',
          api_key: json.api_key || '',
          architecture_only: json.architecture_only || false
        };
        
        console.log('Setting new specification:', newSpec);
        setSpecification(newSpec);
        setUploadStatus(`Loaded: ${json.project_name} (${moduleCount} modules)`);
        toast.success(`Loaded: ${json.project_name} (${moduleCount} modules)`);
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        console.error('JSON Parse Error:', error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        setUploadStatus(`Error: ${errorMsg}`);
        toast.error(errorMsg);
      }
    };
    reader.onerror = () => {
      setUploadStatus('Failed to read file');
      toast.error('Failed to read file');
    };
    reader.readAsText(file);
  };

  const handleDownloadJSON = () => {
    const json = {
      project_name: specification.project_name,
      description: specification.description || '',
      target_platform: specification.mcu,
      modules: specification.modules,
      constraints: specification.constraints || {},
      requirements: specification.requirements || [],
      safety_critical: specification.safety_critical || false,
      optimization_goal: specification.optimization_goal || 'balanced',
      model_provider: specification.model_provider || 'mock',
      model_name: specification.model_name || '',
      api_key: specification.api_key || '',
      architecture_only: specification.architecture_only || false,
      include_tests: true,
      include_docs: true,
      run_quality_checks: true
    };

    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${specification.project_name || 'firmware-spec'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Configuration downloaded');
  };

  const handleAddModule = () => {
    addModule({
      name: '',
      type: '',
      description: '',
      parameters: {}
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!specification.project_name || !specification.mcu || specification.modules.length === 0) {
      toast.error('Please fill in all required fields and add at least one module');
      return;
    }
    onSubmit(specification);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* JSON Import/Export */}
      <Card>
        <div className="flex justify-between items-start gap-4">
          <div>
            <h3 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
              <FiSettings /> Configuration Management
            </h3>
            <p className="text-sm text-muted mt-1">Import existing config or save your current configuration</p>
            <p className="text-xs text-muted mt-2 font-mono">Expected JSON format: {'{project_name, target_platform, modules[], requirements[], ...}'}</p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleUploadJSON}
                className="hidden"
                id="json-upload"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 whitespace-nowrap"
                title="Upload JSON configuration file"
              >
                <FiUpload /> Upload JSON
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleDownloadJSON}
                className="flex items-center gap-2 whitespace-nowrap"
                title="Download current configuration as JSON"
              >
                <FiDownload /> Download JSON
              </Button>
            </div>
            <div className="text-xs text-muted text-right">
              {uploadStatus || 'Ready for upload'}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FiCpu /> Project Details
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Project Name *</label>
            <Input
              value={specification.project_name}
              onChange={(e) => setSpecification({ ...specification, project_name: e.target.value })}
              placeholder="e.g., Motor Controller v2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              className="w-full px-3 py-2 input-base focus:outline-none focus:ring-2 focus:ring-accent"
              value={specification.description || ''}
              onChange={(e) => setSpecification({ ...specification, description: e.target.value })}
              placeholder="Describe your firmware system requirements..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Target MCU/Platform *</label>
              <Select
                value={specification.mcu}
                onChange={(e) => setSpecification({ ...specification, mcu: e.target.value })}
                required
              >
                <option value="">Select MCU...</option>
                <optgroup label="ARM Cortex-M">
                  <option value="STM32F103">STM32F103 (Cortex-M3, 72MHz)</option>
                  <option value="STM32F407">STM32F407 (Cortex-M4, 168MHz, FPU)</option>
                  <option value="STM32L476">STM32L476 (Cortex-M4, Low Power)</option>
                  <option value="NRF52840">nRF52840 (Cortex-M4, BLE)</option>
                </optgroup>
                <optgroup label="ESP">
                  <option value="ESP32">ESP32 (Dual-core, WiFi/BT)</option>
                  <option value="ESP8266">ESP8266 (WiFi)</option>
                </optgroup>
                <optgroup label="AVR">
                  <option value="ATmega328P">ATmega328P (Arduino Uno)</option>
                  <option value="ATmega2560">ATmega2560 (Arduino Mega)</option>
                </optgroup>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Optimization Goal</label>
              <Select
                value={specification.optimization_goal || 'balanced'}
                onChange={(e) => setSpecification({ ...specification, optimization_goal: e.target.value })}
              >
                <option value="balanced">Balanced</option>
                <option value="speed">Speed (Performance)</option>
                <option value="size">Size (Code Size)</option>
                <option value="power">Power (Low Power)</option>
              </Select>
            </div>
          </div>

          {Object.keys(templates).length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">Load from Template</label>
              <Select onChange={(e) => handleLoadTemplate(e.target.value)}>
                <option value="">Select template...</option>
                {Object.keys(templates).map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </Select>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="safety-critical"
              checked={specification.safety_critical || false}
              onChange={(e) => setSpecification({ ...specification, safety_critical: e.target.checked })}
              className="w-4 h-4 text-muted rounded"
            />
            <label htmlFor="safety-critical" className="text-sm font-medium">
              Safety-Critical System (enables additional checks and redundancy)
            </label>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold">Hardware Modules</h3>
            <p className="text-sm text-muted">Define peripherals and components</p>
          </div>
          <Button type="button" variant="secondary" onClick={handleAddModule} className="flex items-center gap-2">
            <FiPlus /> Add Module
          </Button>
        </div>

        <div className="space-y-4">
          {specification.modules.map((module, index) => (
            <div key={index} className="border border-var rounded-lg p-4 space-y-3 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Module Name *</label>
                      <Input
                        value={module.name}
                        onChange={(e) => updateModule(index, { ...module, name: e.target.value })}
                        placeholder="e.g., UART_DEBUG"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Type *</label>
                      <Select
                        value={module.type}
                        onChange={(e) => updateModule(index, { ...module, type: e.target.value })}
                        required
                      >
                        <option value="">Select type...</option>
                        <optgroup label="Communication">
                          <option value="uart">UART/USART</option>
                          <option value="spi">SPI</option>
                          <option value="i2c">I2C</option>
                          <option value="can">CAN Bus</option>
                          <option value="ethernet">Ethernet</option>
                          <option value="usb">USB</option>
                        </optgroup>
                        <optgroup label="Sensors">
                          <option value="temperature">Temperature Sensor</option>
                          <option value="pressure">Pressure Sensor</option>
                          <option value="accelerometer">Accelerometer</option>
                          <option value="gyroscope">Gyroscope</option>
                        </optgroup>
                        <optgroup label="Actuators">
                          <option value="motor">Motor Control</option>
                          <option value="servo">Servo</option>
                          <option value="relay">Relay</option>
                        </optgroup>
                        <optgroup label="Storage">
                          <option value="flash">Flash Memory</option>
                          <option value="eeprom">EEPROM</option>
                          <option value="sdcard">SD Card</option>
                        </optgroup>
                        <optgroup label="Other">
                          <option value="adc">ADC</option>
                          <option value="dac">DAC</option>
                          <option value="pwm">PWM</option>
                          <option value="timer">Timer</option>
                          <option value="watchdog">Watchdog</option>
                        </optgroup>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <Input
                        value={module.description || ''}
                        onChange={(e) => updateModule(index, { ...module, description: e.target.value })}
                        placeholder="Purpose of this module"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Hardware Parameters (JSON)</label>
                    <textarea
                      className="w-full px-3 py-2 input-base font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                      value={JSON.stringify(module.parameters || {}, null, 2)}
                      onChange={(e) => {
                        try {
                          const params = JSON.parse(e.target.value);
                          updateModule(index, { ...module, parameters: params });
                        } catch (err) {
                          // Invalid JSON, keep editing
                        }
                      }}
                      rows={5}
                      placeholder='{\n  "baudrate": 115200,\n  "pins": {"tx": "PA9", "rx": "PA10"},\n  "interrupt": true\n}'
                    />
                    <p className="text-xs text-muted mt-1">
                      Tip: Specify hardware-specific configs like pins, baudrate, addresses, etc.
                    </p>
                  </div>

                  {module.type && (
                    <div className="surface border border-var rounded p-2">
                      <p className="text-xs text-muted">
                        <strong>Tip for {module.type}:</strong> {getModuleHint(module.type)}
                      </p>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeModule(index)}
                  className="ml-4 p-2 text-muted hover:text-red-600 hover:bg-white/3 rounded transition-colors"
                  title="Remove module"
                >
                  <FiTrash2 size={18} />
                </button>
              </div>
            </div>
          ))}

          {specification.modules.length === 0 && (
            <div className="text-center py-12 text-muted border-2 border-dashed border-var rounded-lg">
              <p className="text-lg mb-2">No modules added yet</p>
              <p className="text-sm">Click "Add Module" to define your hardware components</p>
            </div>
          )}
        </div>
      </Card>

      {/* Requirements Section */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">System Requirements (Optional)</h3>
        <textarea
          className="w-full px-3 py-2 input-base focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm"
          value={(specification.requirements || []).join('\n')}
          onChange={(e) => setSpecification({ 
            ...specification, 
            requirements: e.target.value.split('\n').filter(r => r.trim()) 
          })}
          rows={4}
          placeholder="Enter requirements (one per line):\n- Real-time response < 10ms\n- Low power consumption\n- CAN bus communication\n- Temperature range: -40°C to 85°C"
        />
      </Card>

      {/* Advanced Options */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Advanced Options</h3>
            <p className="text-sm text-muted">Model provider, API keys, and architecture-only mode</p>
          </div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm font-medium text-muted hover:text-white"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced
          </button>
        </div>

        {showAdvanced && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Model Provider</label>
                <Select
                  value={specification.model_provider || 'mock'}
                  onChange={(e) => setSpecification({ ...specification, model_provider: e.target.value })}
                >
                  <option value="mock">Mock (Offline / No API)</option>
                  <option value="gemini">Gemini (Google)</option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Model Name (Optional)</label>
                <Input
                  value={specification.model_name || ''}
                  onChange={(e) => setSpecification({ ...specification, model_name: e.target.value })}
                  placeholder="e.g., gemini-2.5-flash"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">API Key (Optional)</label>
              <Input
                type="password"
                value={specification.api_key || ''}
                onChange={(e) => setSpecification({ ...specification, api_key: e.target.value })}
                placeholder="Paste your provider API key"
              />
              <p className="text-xs text-muted mt-1">Stored locally in memory for this session only</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">API Base URL</label>
              <Input
                value={apiBaseUrl}
                onChange={(e) => {
                  const value = e.target.value;
                  setApiBaseUrl(value);
                  localStorage.setItem('apiBaseUrl', value);
                }}
                placeholder="/api or http://localhost:8000/api"
              />
              <p className="text-xs text-gray-500 mt-1">Used for all API requests from the UI</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="architecture-only"
                checked={specification.architecture_only || false}
                onChange={(e) => setSpecification({ ...specification, architecture_only: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <label htmlFor="architecture-only" className="text-sm font-medium">
                Architecture-only mode (skip code, tests, quality, build)
              </label>
            </div>
          </div>
        )}
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={handleDownloadJSON}>
          Save Configuration
        </Button>
        <Button type="submit" variant="primary" className="px-8 py-3 text-lg">
          Generate Firmware & Architecture
        </Button>
      </div>
    </form>
  );
};

function getModuleHint(type: string): string {
  const hints: Record<string, string> = {
    uart: 'Specify baudrate, data bits, parity, stop bits, and pin assignments',
    spi: 'Define clock speed, mode (0-3), CS pin, and data order (MSB/LSB first)',
    i2c: 'Set clock frequency (100kHz/400kHz), slave address, and SDA/SCL pins',
    can: 'Configure bitrate, filters, and acceptance masks',
    temperature: 'Specify sensor model, interface (I2C/SPI/Analog), and sampling rate',
    motor: 'Define PWM frequency, direction pins, and encoder configuration',
    adc: 'Set resolution (8/10/12-bit), sampling rate, and channel configuration',
    pwm: 'Configure frequency, duty cycle range, and timer allocation',
    flash: 'Specify memory size, page size, and wear leveling requirements',
  };
  return hints[type] || 'Define all hardware-specific parameters for this module';
}

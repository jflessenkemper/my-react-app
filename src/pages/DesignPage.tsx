import React from 'react';

export default function DesignPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-700 text-white flex items-center justify-center p-8">
      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-xl shadow-xl p-8 max-w-4xl w-full border border-white/20">
        <h1 className="text-4xl font-bold text-center mb-10 text-white drop-shadow-lg">Design Reference: Input Elements (Glassmorphism)</h1>

        {/* Text Input */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-6 text-white">Text Input</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="text-normal" className="block text-gray-300 text-sm font-bold mb-2">Normal State</label>
              <input
                type="text"
                id="text-normal"
                placeholder="Enter text..."
                className="w-full p-3 rounded-lg bg-white/5 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder-gray-400 transition duration-300 ease-in-out shadow-inner-custom"
              />
            </div>
            <div>
              <label htmlFor="text-focused" className="block text-gray-300 text-sm font-bold mb-2">Focused State</label>
              <input
                type="text"
                id="text-focused"
                placeholder="Enter text..."
                className="w-full p-3 rounded-lg bg-white/5 border border-white/20 ring-2 ring-blue-400 outline-none border-transparent text-white placeholder-gray-400 transition duration-300 ease-in-out shadow-inner-custom"
              />
            </div>
            <div>
              <label htmlFor="text-disabled" className="block text-gray-300 text-sm font-bold mb-2">Disabled State</label>
              <input
                type="text"
                id="text-disabled"
                placeholder="Disabled text..."
                disabled
                className="w-full p-3 rounded-lg bg-white/5 border border-white/10 cursor-not-allowed text-gray-500 placeholder-gray-600 shadow-inner-custom"
              />
            </div>
            <div>
              <label htmlFor="text-readonly" className="block text-gray-300 text-sm font-bold mb-2">Read-only State</label>
              <input
                type="text"
                id="text-readonly"
                placeholder="Read-only text..."
                readOnly
                value="This is read-only"
                className="w-full p-3 rounded-lg bg-white/5 border border-white/20 cursor-text text-gray-300 placeholder-gray-400 shadow-inner-custom"
              />
            </div>
            <div>
              <label htmlFor="text-error" className="block text-red-300 text-sm font-bold mb-2">Error State</label>
              <input
                type="text"
                id="text-error"
                placeholder="Error text..."
                className="w-full p-3 rounded-lg bg-white/5 border border-red-500 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent text-white placeholder-gray-400 transition duration-300 ease-in-out shadow-inner-custom"
              />
              <p className="text-red-300 text-xs mt-1">Error message here</p>
            </div>
          </div>
        </section>

        {/* Password Input */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-6 text-white">Password Input</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="password-normal" className="block text-gray-300 text-sm font-bold mb-2">Normal State</label>
              <input
                type="password"
                id="password-normal"
                placeholder="Enter password..."
                className="w-full p-3 rounded-lg bg-white/5 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder-gray-400 transition duration-300 ease-in-out shadow-inner-custom"
              />
            </div>
            <div>
              <label htmlFor="password-disabled" className="block text-gray-300 text-sm font-bold mb-2">Disabled State</label>
              <input
                type="password"
                id="password-disabled"
                placeholder="Disabled password..."
                disabled
                className="w-full p-3 rounded-lg bg-white/5 border border-white/10 cursor-not-allowed text-gray-500 placeholder-gray-600 shadow-inner-custom"
              />
            </div>
          </div>
        </section>

        {/* Email Input */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-6 text-white">Email Input</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="email-normal" className="block text-gray-300 text-sm font-bold mb-2">Normal State</label>
              <input
                type="email"
                id="email-normal"
                placeholder="Enter email..."
                className="w-full p-3 rounded-lg bg-white/5 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder-gray-400 transition duration-300 ease-in-out shadow-inner-custom"
              />
            </div>
            <div>
              <label htmlFor="email-error" className="block text-red-300 text-sm font-bold mb-2">Error State</label>
              <input
                type="email"
                id="email-error"
                placeholder="Error email..."
                className="w-full p-3 rounded-lg bg-white/5 border border-red-500 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent text-white placeholder-gray-400 transition duration-300 ease-in-out shadow-inner-custom"
              />
              <p className="text-red-300 text-xs mt-1">Invalid email format</p>
            </div>
          </div>
        </section>

        {/* Number Input */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-6 text-white">Number Input</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="number-normal" className="block text-gray-300 text-sm font-bold mb-2">Normal State</label>
              <input
                type="number"
                id="number-normal"
                placeholder="Enter number..."
                className="w-full p-3 rounded-lg bg-white/5 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder-gray-400 transition duration-300 ease-in-out shadow-inner-custom"
              />
            </div>
            <div>
              <label htmlFor="number-disabled" className="block text-gray-300 text-sm font-bold mb-2">Disabled State</label>
              <input
                type="number"
                id="number-disabled"
                placeholder="Disabled number..."
                disabled
                className="w-full p-3 rounded-lg bg-white/5 border border-white/10 cursor-not-allowed text-gray-500 placeholder-gray-600 shadow-inner-custom"
              />
            </div>
          </div>
        </section>

        {/* Textarea */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-6 text-white">Textarea</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="textarea-normal" className="block text-gray-300 text-sm font-bold mb-2">Normal State</label>
              <textarea
                id="textarea-normal"
                placeholder="Enter multi-line text..."
                rows={4}
                className="w-full p-3 rounded-lg bg-white/5 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder-gray-400 transition duration-300 ease-in-out shadow-inner-custom"
              ></textarea>
            </div>
            <div>
              <label htmlFor="textarea-error" className="block text-red-300 text-sm font-bold mb-2">Error State</label>
              <textarea
                id="textarea-error"
                placeholder="Error multi-line text..."
                rows={4}
                className="w-full p-3 rounded-lg bg-white/5 border border-red-500 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent text-white placeholder-gray-400 transition duration-300 ease-in-out shadow-inner-custom"
              ></textarea>
              <p className="text-red-300 text-xs mt-1">This field is required</p>
            </div>
          </div>
        </section>

        {/* Select Dropdown */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-6 text-white">Select Dropdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="select-normal" className="block text-gray-300 text-sm font-bold mb-2">Normal State</label>
              <div className="relative">
                <select
                  id="select-normal"
                  className="block appearance-none w-full p-3 rounded-lg bg-white/5 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white transition duration-300 ease-in-out pr-8 shadow-inner-custom"
                >
                  <option value="" disabled selected hidden className="bg-gray-800 text-gray-400">Select an option</option>
                  <option value="option1" className="bg-gray-800 text-white">Option 1</option>
                  <option value="option2" className="bg-gray-800 text-white">Option 2</option>
                  <option value="option3" className="bg-gray-800 text-white">Option 3</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>
            <div>
              <label htmlFor="select-disabled" className="block text-gray-300 text-sm font-bold mb-2">Disabled State</label>
              <div className="relative">
                <select
                  id="select-disabled"
                  disabled
                  className="block appearance-none w-full p-3 rounded-lg bg-white/5 border border-white/10 cursor-not-allowed text-gray-500 pr-8 shadow-inner-custom"
                >
                  <option value="" disabled selected hidden className="bg-gray-800 text-gray-600">Select an option</option>
                  <option value="option1" className="bg-gray-800 text-gray-500">Option 1</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-600">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Checkbox */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-6 text-white">Checkbox</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="checkbox-normal"
                className="form-checkbox h-5 w-5 text-blue-600 bg-white/5 border border-white/20 rounded focus:ring-blue-400 focus:ring-2 transition duration-300 ease-in-out"
              />
              <label htmlFor="checkbox-normal" className="ml-2 text-gray-300">Normal Checkbox</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="checkbox-checked"
                checked
                readOnly
                className="form-checkbox h-5 w-5 text-blue-600 bg-white/5 border border-white/20 rounded focus:ring-blue-400 focus:ring-2 transition duration-300 ease-in-out"
              />
              <label htmlFor="checkbox-checked" className="ml-2 text-gray-300">Checked Checkbox</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="checkbox-disabled"
                disabled
                className="form-checkbox h-5 w-5 text-gray-500 bg-white/5 border border-white/10 rounded cursor-not-allowed"
              />
              <label htmlFor="checkbox-disabled" className="ml-2 text-gray-500">Disabled Checkbox</label>
            </div>
          </div>
        </section>

        {/* Radio Buttons */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-6 text-white">Radio Buttons</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center">
              <input
                type="radio"
                id="radio-normal-1"
                name="radio-group-1"
                className="form-radio h-5 w-5 text-blue-600 bg-white/5 border border-white/20 focus:ring-blue-400 focus:ring-2 transition duration-300 ease-in-out"
              />
              <label htmlFor="radio-normal-1" className="ml-2 text-gray-300">Radio Option 1</label>
            </div>
            <div className="flex items-center">
              <input
                type="radio"
                id="radio-normal-2"
                name="radio-group-1"
                checked
                readOnly
                className="form-radio h-5 w-5 text-blue-600 bg-white/5 border border-white/20 focus:ring-blue-400 focus:ring-2 transition duration-300 ease-in-out"
              />
              <label htmlFor="radio-normal-2" className="ml-2 text-gray-300">Radio Option 2 (Selected)</label>
            </div>
            <div className="flex items-center">
              <input
                type="radio"
                id="radio-disabled"
                name="radio-group-2"
                disabled
                className="form-radio h-5 w-5 text-gray-500 bg-white/5 border border-white/10 cursor-not-allowed"
              />
              <label htmlFor="radio-disabled" className="ml-2 text-gray-500">Radio Option (Disabled)</label>
            </div>
          </div>
        </section>

        {/* File Input */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-6 text-white">File Input</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="file-normal" className="block text-gray-300 text-sm font-bold mb-2">Normal State</label>
              <input
                type="file"
                id="file-normal"
                className="w-full text-white text-sm
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-500 file:text-white
                  hover:file:bg-blue-600
                  bg-white/5 rounded-lg border border-white/20
                  transition duration-300 ease-in-out cursor-pointer"
              />
            </div>
            <div>
              <label htmlFor="file-disabled" className="block text-gray-300 text-sm font-bold mb-2">Disabled State</label>
              <input
                type="file"
                id="file-disabled"
                disabled
                className="w-full text-gray-500 text-sm
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-gray-600 file:text-gray-400
                  file:cursor-not-allowed
                  bg-white/5 rounded-lg border border-white/10
                  transition duration-300 ease-in-out cursor-not-allowed"
              />
            </div>
          </div>
        </section>

        {/* Date Input */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-6 text-white">Date Input</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="date-normal" className="block text-gray-300 text-sm font-bold mb-2">Normal State</label>
              <input
                type="date"
                id="date-normal"
                className="w-full p-3 rounded-lg bg-white/5 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder-gray-400 transition duration-300 ease-in-out shadow-inner-custom
                           appearance-none [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              />
            </div>
            <div>
              <label htmlFor="date-disabled" className="block text-gray-300 text-sm font-bold mb-2">Disabled State</label>
              <input
                type="date"
                id="date-disabled"
                disabled
                className="w-full p-3 rounded-lg bg-white/5 border border-white/10 cursor-not-allowed text-gray-500 placeholder-gray-600 shadow-inner-custom
                           appearance-none [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:cursor-not-allowed"
              />
            </div>
          </div>
        </section>

        {/* Time Input */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-6 text-white">Time Input</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="time-normal" className="block text-gray-300 text-sm font-bold mb-2">Normal State</label>
              <input
                type="time"
                id="time-normal"
                className="w-full p-3 rounded-lg bg-white/5 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder-gray-400 transition duration-300 ease-in-out shadow-inner-custom
                           appearance-none [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              />
            </div>
            <div>
              <label htmlFor="time-disabled" className="block text-gray-300 text-sm font-bold mb-2">Disabled State</label>
              <input
                type="time"
                id="time-disabled"
                disabled
                className="w-full p-3 rounded-lg bg-white/5 border border-white/10 cursor-not-allowed text-gray-500 placeholder-gray-600 shadow-inner-custom
                           appearance-none [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:cursor-not-allowed"
              />
            </div>
          </div>
        </section>

        {/* Range Input (Slider) */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-6 text-white">Range Input (Slider)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="range-normal" className="block text-gray-300 text-sm font-bold mb-2">Normal State</label>
              <input
                type="range"
                id="range-normal"
                min="0" max="100"
                className="w-full h-2 rounded-lg appearance-none bg-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400 accent-blue-400 cursor-pointer"
              />
            </div>
            <div>
              <label htmlFor="range-disabled" className="block text-gray-300 text-sm font-bold mb-2">Disabled State</label>
              <input
                type="range"
                id="range-disabled"
                min="0" max="100"
                disabled
                className="w-full h-2 rounded-lg appearance-none bg-white/10 cursor-not-allowed accent-gray-500"
              />
            </div>
          </div>
        </section>

        {/* Color Input */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-6 text-white">Color Input</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="color-normal" className="block text-gray-300 text-sm font-bold mb-2">Normal State</label>
              <input
                type="color"
                id="color-normal"
                value="#4299E1"
                className="w-full h-12 rounded-lg bg-white/5 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-300 ease-in-out cursor-pointer"
              />
            </div>
            <div>
              <label htmlFor="color-disabled" className="block text-gray-300 text-sm font-bold mb-2">Disabled State</label>
              <input
                type="color"
                id="color-disabled"
                value="#A0AEC0"
                disabled
                className="w-full h-12 rounded-lg bg-white/5 border border-white/10 cursor-not-allowed"
              />
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 text-white">Buttons</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-xl transition duration-300 ease-in-out transform hover:scale-105 glass-button">
              Primary Button
            </button>
            <button className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg shadow-xl transition duration-300 ease-in-out transform hover:scale-105 glass-button">
              Secondary Button
            </button>
            <button className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-xl transition duration-300 ease-in-out transform hover:scale-105 glass-button">
              Danger Button
            </button>
            <button disabled className="bg-blue-400 text-white font-bold py-3 px-6 rounded-lg cursor-not-allowed opacity-70 glass-button-disabled">
              Disabled Button
            </button>
            <button className="border border-blue-400 text-blue-400 font-bold py-3 px-6 rounded-lg hover:bg-blue-400 hover:text-white transition duration-300 ease-in-out transform hover:scale-105 glass-button-outline">
              Outline Button
            </button>
          </div>
        </section>

      </div>
    </div>
  );
} 
/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const { fsutils, GAError, syslog } = require('gajn-framework');
const path = require('path');
const sass = require('node-sass');
const postcss = require('postcss');
const autoprefixer = require('autoprefixer');
const fs = require('fs');

class StaticoScssAssetsHandlerError extends GAError {}
 
 /**
  * Scss assets handler.
  */
 class ScssAssetsHandler
 { 
    /**
     * Constructor.
     * 
     * @param   {Config}    config      Global config object.
     * 
     * @return  {MarkdownTemplateHandler}
     */
    constructor(config)
    { 
        this.config = config;
    }
 
    /**
     * Process a file.
     * 
     * @param   {string}    filePath    Path to file to process.
     * 
     * @return
     */
    async process(filePath)
    {
        let engineOptions = this.config.assetHandlers.scss.engineOptions;
        let userOptions = this.config.assetHandlers.scss.userOptions;

        engineOptions.file = filePath;

        let fp = filePath.replace(this.config.sitePath, '');
        let op = path.join(this.config.outputPath, userOptions.output, path.basename(fp, path.extname(fp)) + '.css');
        syslog.trace(`SCSS template handler is processing file: ${fp} => ${op}`, 'AssetsHandler:Scss');

        engineOptions.outFile = op;

        let compiled = false;

        try {
            compiled = sass.renderSync(engineOptions);
        } catch (e) {
            throw new StaticoScssAssetsHandlerError(`Unable to render SCSS: ${e.message}`);
        }

        if (userOptions.autoPrefix) {
            let postcssOptions = {
                from: undefined
            };
    
            let data;
            postcss([ autoprefixer ]).process(compiled.css, postcssOptions).then((result) => {
                result.warnings().forEach((warn) => {
                    syslog.warning(warn.toString())
                });
                syslog.trace(`Autoprefixing CSS for: ${fp}.`, 'AssetsHandler:Scss');
                data = result.css;
                return data;
            }).then((data) => {
                compiled.css = data;
            })    
        }

        fsutils.mkdirRecurse(path.dirname(op));
        fs.writeFileSync(op, compiled.css.toString());


        if (!fs.existsSync(op)) {
            throw new StaticoScssAssetsHandlerError(`For some reason the generated CSS file '${op}' does not exist.`);
        }     

        let opi = op.replace(this.config.sitePath, '');
        syslog.debug(`Wrote ${fp} ===> ${opi}.`, 'AssetsHandler:Scss');
    }
 
  }
 
 module.exports = ScssAssetsHandler;
 
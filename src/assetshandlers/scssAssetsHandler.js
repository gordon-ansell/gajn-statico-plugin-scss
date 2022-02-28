/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const { fsutils, GAError, syslog } = require('js-framework');
const path = require('path');
//const sass = require('node-sass');
const sass = require('sass');
const postcss = require('postcss');
const autoprefixer = require('autoprefixer');
const fs = require('fs');
const debug = require('debug')('Statico:plugin:scss:ScssAssetHandler'),
      debugf = require('debug')('Full.Statico:plugin:scss:ScssAssetHandler'),
      debugd = require('debug')('DryRun.Statico:plugin:scss:ScssAssetHandler');


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
        debug(`SCSS template handler is processing file: ${fp} => ${op}`);

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
                debug(`Autoprefixing CSS for: ${fp}.`);
                data = result.css;
                return data;
            }).then((data) => {
                compiled.css = data;
            })    
        }

        if (this.config.processArgs.argv.dryrun) {
            debugd(`Write: %s`, op.replace(this.config.sitePath, ''));
        } else {
            fsutils.mkdirRecurse(path.dirname(op));
            fs.writeFileSync(op, compiled.css.toString());

            if (!fs.existsSync(op)) {
                throw new StaticoScssAssetsHandlerError(`For some reason the generated CSS file '${op}' does not exist.`);
            }
        }     

        let opi = op.replace(this.config.sitePath, '');
        debug(`Wrote ${fp} ===> ${opi}.`);
    }
 
  }
 
 module.exports = ScssAssetsHandler;
 
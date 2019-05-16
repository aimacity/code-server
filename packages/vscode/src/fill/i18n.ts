import { readFile, writeFile } from "fs";
import { promisify } from "util";
import * as paths from "./paths";
import { logger, field } from "@coder/logger";
import * as nls from "vs/nls";
/**
 * class for client i18n
 */
class LanguagePack {
     /**
     * read locale.json
     */
    private async readLocale(): Promise<string> {
        const file = paths._paths.appData + "/User" + "/locale.json";
        logger.info("try to load locale setting with path:" + file);
        return promisify(readFile)(file, "utf8");
    }
    /**
     * read locale from config file
     */
    public async getLocale(): Promise<string> {
			try {
                const contents =await this.readLocale();
				const json = JSON.parse(contents);
				if(json && json.locale) {
                    localStorage.setItem("locale",json.locale);
                    return json.locale;
                }
			} catch(e) {
				logger.error(e);
            }
            return "";
    }
    public async  initLocale(locale): void{
        process.env["VSCODE_NLS_CONFIG"] ="{}";
        localStorage.removeItem("VSCODE_NLS_CONFIG");
        const messages =await this.loadI18n(locale);
        if(messages ) {
            (nls as any).addLocale(locale,messages);
            localStorage.setItem(locale,JSON.stringify(messages));
        }
    }
    /**
     * init i18n for web client
     */
    public async initialize(): Promise<void> {
        const locale =await this.getLocale();
        logger.info("use locale:" + locale);
        if(locale) {
            const msgs = localStorage.getItem(locale);
            const nslCfg =  localStorage.getItem("VSCODE_NLS_CONFIG");
            if (msgs&&nslCfg) {
               const nlsJson = JSON.parse(nslCfg);
               if(nlsJson.locale ===locale ){
                logger.info("use cached locale:" + locale);
                (nls as any).addLocale(locale,JSON.parse(msgs));
               } else {
                await this.initLocale(locale);
               }
            } else {
                await this.initLocale(locale);
            }
        }
    }
    private  async readPack(locale:string): Promise<object> {
        const file = paths._paths.appData + "/languagepacks.json";
        const packs = await promisify(readFile)(file, "utf8");
       const cfg =  JSON.parse(packs);
       return cfg;
    }
    /**
     * load messages for locale
     * @param locale  locale
     */
    private  async loadI18n(locale:string): Promise<any> {
        const msgs = {};
        try {
           const cfg = await this.readPack(locale);
           if(cfg&&cfg[locale]&&cfg[locale]["translations"]) {
          const  packConfig = cfg[locale] ;
          const lp = require ("./languagepack");
          const metaDataFile = paths._paths.appData + "/nls.metadata.json";
          const nsconfig = await  lp.getNLSConfiguration("999999", paths._paths.appData, metaDataFile, locale,cfg);
           process.env["VSCODE_NLS_CONFIG"] = JSON.stringify(nsconfig);
           localStorage.setItem("VSCODE_NLS_CONFIG",JSON.stringify(nsconfig));
          logger.info(JSON.stringify(process.env));

               const mainFile = cfg[locale]["translations"]["vscode"];
               const content = await promisify(readFile)(mainFile, "utf8");
               const data = JSON.parse(content);
               for(let p in data.contents)   {
                let sub = data.contents[p];
                if(sub) {
                    for(let key in sub) {
                       msgs[key] = sub[key];
                    }
                }
            }
            return msgs;
           }
        } catch (e) {
             // console.error('load zh-cn i 18 failed');
            return null;
        }
    }
}
export const lp = new LanguagePack();

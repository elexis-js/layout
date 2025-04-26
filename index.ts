import 'elexis/core';
import { $Layout } from './lib/$Layout';
declare module 'elexis/core' {
    export namespace $ {
        export interface TagNameElementMap {
            'layout': typeof $Layout;
        } 
    }
}
$.registerTagName('layout', $Layout)

export * from './lib/$Layout'
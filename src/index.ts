import 'elexis/core';
import { $Layout } from '#node/$Layout';
declare module 'elexis/core' {
    export namespace $ {
        export interface TagNameElementMap {
            'layout': typeof $Layout;
        } 
    }
}
$.registerTagName('layout', $Layout)

export * from '#node/$Layout'
/**
 * Created by gordianknot on 20/9/16.
 */

/**
 *
 * @param [string] libs
 *
 * usage:
 * libraries = ['jQuery', '_', 'showdown']
 * $handler = new StartupHandler(...libraries)
 *     $handler.onLibrariesInitialized(function(handler){
 *     $webapp = new GoogleKeepMarkdownRenderingApp()
 * })
 */


class _$StartupHandler$_ {
   constructor( instances_chk) {
      this.ensureStringArray(instances_chk)
      this.script_src = document.getElementsByTagName('head')[0]
         .appendChild(document.createElement('script'))

      console.log('check if library:', instances_chk, 'loaded')
      this.libraries = instances_chk
      this.startup_delay = 400
      this.triggerPending()

      //document.getElementsByTagName('head')[0]
      //   .getElementsByTagName('script')
      //   .bind("DOMSubtreeModified", function () {
      //      this._onLibraryLoaded()
      //   });
   }

   triggerPending() {
      setTimeout(this.pending.bind(this), this.startup_delay)
   }

   pending() {
      if (!this.testLibrariesLoaded()) {
         this.triggerPending()
         return
      }
      console.info('------------------STARTUP-----------------------------------')
      console.info('added JSLib:', this.libraries)
      this._onLibrariesInitialized()
   }

   ensureStringArray(array) {
      array.forEach(function (el) {
         if (typeof(el) != 'string') new Error('invalid libraries assignment')
      })
   }

   testLibrariesLoaded() {
      for (let l of this.libraries) {
         if (eval(l) === undefined)
            return false
      }
      console.log('lib all loaded')
      console.log(this.libraries)
      return true
   }

   onLibraryLoaded(fn) {
      new Error('Not Implemented yet')
      this.onLibraryLoaded = fn.bind(this)
   }

   _onLibraryLoaded() {
      new Error('Not Implemented yet')
      this.onLibraryLoaded()
   }

   onLibrariesInitialized(fn) {
      this.onLibrariesInitialized = fn.bind(this)
   }

   _onLibrariesInitialized(...params) {
      function someAction() {
         let scripts =
                document.getElementsByTagName('head')[0]
                   .getElementsByTagName('script')
         for (let l of scripts) {
            l.setAttribute('addedBy', 'server')
         }
      }

      someAction()
      this.onLibrariesInitialized()
   }

   installLibraries(libs) {
      // jquery-lang.js lodash.js showdown
      for(let lib of libs){
         this.script_src.setAttribute('src', lib)
      }
   }
}


//$handler = {
//   libs:{
//      search_name:['jquery-lang.js', 'lodash.js', 'showdown'],
//      instances :['jQuery', '_', 'showdown']
//   },
//   onAppReady:function(){$webapp = new GoogleKeepMarkdownRenderingAddon()}
//}

console.log('found handler:', $handler)

$handler.handler = new _$StartupHandler$_(
   $handler.libs.instances_chk)
$handler.handler.onLibrariesInitialized(function (handler) {
   $handler.onAppReady()
})




/**
 * Created by gordianknot on 19/9/16.
 */
//------------------------------------------
//       global scope varaibles override
//------------------------------------------
var showdown = undefined,
    jQuery   = undefined,
    _        = undefined,
    $webapp  = undefined,
    $handler = undefined


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
   constructor(search_name=[], instances=[]) {
      this.ensureStringArray(search_name)
      this.ensureStringArray(instances)
      this.libraries = instances
      this.installLibraries(search_name)
      this.startup_delay = 400
      this.triggerPending()
      this.script_src = document.getElementsByTagName('head')[0]
         .appendChild(document.createElement('script'))
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
         if (eval(l) == undefined)
            return false
      }
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
      var xhttp = new XMLHttpRequest(),
          cdnjs = `https://api.cdnjs.com/libraries?search=${lib.name}`,
          script = this.script_src

      xhttp.onreadystatechange = function () {
         if (xhttp.readyState == XMLHttpRequest.DONE) {
            if (xhttp.status == 200) {
               let json = JSON.parse(xhttp.responseText).results.slice(0, 20)
               script.setAttribute('src', json[0].latest)
            }
            else if (xhttp.status == 400) {
               alert('There was an error 400');
            }
            else {
               alert('something else other than 200 was returned');
            }
         }
      };
      for (let lib of libs) {
         lib = {name: lib}
         console.log('js:', cdnjs)
         xhttp.open("GET", cdnjs, true);
         xhttp.send()
      }
   }
}



$handler = new _$StartupHandler$_(
   search_name = ['jquery-lang.js', 'lodash.js', 'showdown'],
   instances   = ['jQuery', '_', 'showdown'])
$handler.onLibrariesInitialized(function (handler) {
   $webapp = new GoogleKeepMarkdownRenderingAddon()
})
console.log('_____________________1_______________________')

class CustomMarkdownConverter {
   constructor(converter) {
      converter.listen('images.before', this.beforeParsingImages.bind(this))
      converter.listen('images.after', this.afterParsingImages.bind(this))
   }

   beforeParsingImages(evtName, text, converter, options) {
      return text
   }

   afterParsingImages(evtName, text, converter, options) {
      return text
   }
}
console.log('_____________________2_______________________')
class GoogleKeepMarkdownRenderingAddon {
   constructor() {
      this.content_selector = 'div[data-ogpc]>div:nth-last-child(2)>div'
      this.content_jq_object = $(this.content_selector)
      this.triggered = false
      this.trigger_stack = []
      this.counter = 0
      this.trigger_interval = 500
      this.converter = new showdown.Converter()
      this.notesPreserver = {
         origin   : [],
         converted: []
      }
      var trigger_update = this.trigger_update.bind(this)
      this._notes = this.getRenewedNotes()
      this._notes_raw_texts = Object()
      this._notes_rendered_text = Object()
      new CustomMarkdownConverter(this.converter)
      this.renderInit()
   }

   get notes_raw_texts() {
      return this._notes_raw_texts
   }

   get notes() {
      return this._notes
   }

   renderInit() {
      console.log('render init >>--------->')
      this.renderNoteById(0)
      this.wrapClick(this.note[0])
      this.content_jq_object.bind("DOMNodeInserted DOMNodeRemoved", this.trigger_update.bind(this));
   }

   renderDropped() {
      this.content_jq_object.unbind("DOMNodeInserted DOMNodeRemoved", this.trigger_update.bind(this))
   }

   restoreTextBoforeEdit(note) {
      note.innerText = restored_text
   }

   wrapClick(note) {
      console.log('try bind click')
      if (note.getAttribute('binded') != 'true') {
         console.log('bind click to ', note)
         note.setAttribute('binded', 'true')
         $(note).bind('click', function (event) {
            console.log('click', 'restore original text')
            this.restoreTextBeforeEdit(note)
         })
      }
   }

   getRenewedNotes() {
      return $('div[data-ogpc]>div:nth-last-child(2)>div')
         .children(0)
         .find('div[contenteditable]')
   }

   getNoteById(index) {
      /* @param  integer index
         @return {string:HTMLDivElement} */
      let header_id = index * 2,
          note_id   = index * 2 + 1
      return {
         header: this.notes.eq(header_id)[0],
         note  : this.notes.eq(note_id)[0]
      }
   }

   getNoteContentById(index) {

   }

   getNoteTitleById(index) {

   }

   getOriginNoteByIndex(index) {
      return this.storage.origin[index]
   }

   getConvertedNoteByIndex(index) {
      return this.storage.converted[index]
   }

   triggerEditNote() {

   }

   restoreRawTextById(index, text, html) {
      this._notes_raw_texts[index] = text
      this._notes_rendered_text[index] = html
   }

   // ---------------------------------------
   //          on actions
   //----------------------------------------
   renderNoteById(index, force = false) {
      console.log('renderNoteById', index)
      let note = this.getNoteById(index)
      if (note.note.getAttribute('rendered') == 'true' && !force)
         return
      let text = note.note.innerText
      let html = this.converter.makeHtml(text)
      console.log('text', text.slice(0, 20), '...')
      console.log('html', html.slice(0, 20), '...')
      note.note.innerHTML = html
      note.note.setAttribute('rendered', 'true')
      note.note.setAttribute('order', index)
      this.restoreRawTextById(index, text, html)

   }

   onNewNotesFetched(new_notes) {
      var l    = new_notes.length,
          note = null
      for (let i = 0; i < l; i++) {
         note = new_notes[i]
         this.renderNoteById(this.notes.index(note))
         this.wrapClick(note)
      }
   }

   _onNewNotesFetched() {
      n
      let new_notes = this.getRenewedNotes()
      let old_notes = this.notes
      let diff_notes = _.difference(new_notes, old_notes)
      console.log('trigger rendering..........')
      console.log('diff:', diff_notes)
      this.onNewNotesFetched(diff_notes)
      this._notes = new_notes
   }

   renderMarkDown(markdown) {
      console.log('rendering....')

   }
   
   trigger_update() {
      if (!this.triggered) {
         var self = this
         this.triggered = true
         let id = setTimeout(function () {
            self.triggered = false
            self.trigger_stack = []
            self._onNewNotesFetched()
         }, this.trigger_interval)

         this.trigger_stack.push(id)
         return
      }
      this.triggered = false
      let id = this.trigger_stack.pop()
      clearTimeout(id)
      this.trigger_update()
   }
}
console.log('++++++++++++++++++++++++++++++++++++++++')



import { QuillModules } from 'ngx-quill/config';

export const RICH_TEXT_FORMATS = ['header', 'bold', 'italic', 'underline', 'strike', 'color', 'list', 'link'];

export const RICH_TEXT_MODULES: QuillModules = {
  toolbar: [
    [{ header: [2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean'],
  ],
};

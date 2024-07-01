""""""""""""""""""""""
" Leader
" """"""""""""""""""""""
" " let mapleader=,
" " can't set leaders in Obsidian vim, so the key just has to be used
" consistently.
" " However, it needs to be unmapped, to not trigger default behavior:
" https://github.com/esm7/obsidian-vimrc-support#some-help-with-binding-space-chords-doom-and-spacemacs-fans
unmap ,

nmap jj gj
imap jj gj
nmap k gk
" I like using H and L for beginning/end of line
nmap H ^
nmap L $
" Quickly remove search highlights
nmap <F9> :nohl

" Yank to system clipboard
set clipboard=unnamed

" iabbrev ecal 📅

" List of commands: https://meleu.dev/notes/obcommand-list/
" Or run: :obcommand

" Go back and forward with Ctrl+O and Ctrl+I
" (make sure to remove default Obsidian shortcuts for these to work)
exmap back obcommand app:go-back
nmap <C-o> :back
exmap forward obcommand app:go-forward
nmap <C-i> :forward

" nnoremap ,s gqq

"" Custom
exmap revealFile obcommand file-explorer:reveal-active-file
nnoremap ,s :revealFile

exmap openLeftSidebar obcommand app:toggle-left-sidebar
nnoremap ,h :openLeftSidebar
exmap openRightSidebar obcommand app:toggle-right-sidebar
nnoremap ,l :openRightSidebar

exmap quickadd obcommand quickadd:runQuickAdd
nnoremap ,a :quickadd

exmap openVault obcommand app:open-vault
nnoremap ,z :openVault

exmap openCommandMode obcommand darlal-switcher-plus:switcher-plus:open-commands
nnoremap ,p :openCommandMode

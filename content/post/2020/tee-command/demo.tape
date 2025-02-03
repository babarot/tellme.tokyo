Output demo.gif

Set Shell "zsh"
Set FontSize 24
Set Width 1300
Set Height 500
Set Theme "tokyonight"
Set FontFamily "Hack Nerd Font"

Hide
Type "setopt interactivecomments" Enter
Type "alias ls='exa --group-directories-first'" Enter
Type "date() { echo 'Mon Feb  7 12:42:58 JST 2020'; }" Enter
Type "clear" Enter
Show

## Example 1
Sleep 0.5s
Type "date | tee >(gh issue comment --repo babarot/sandbox 12 --body-file -)" Sleep 0.2s Enter Sleep 0.5s

# See the UI
Sleep 2s

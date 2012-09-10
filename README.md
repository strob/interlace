# InterLace
---
html5 video archive teleputer

## About

InterLace is software for creating and distributing
hypertext-syle ``database video.''

Tags and Overlays can be applied to subsets of source material,
while providing an intuitive interface for viewing these annotations
as navigable video.

## Design

Essentially, there are two modes of access:

1. creation/editing, which grants full read/write access to all
   organization

2. viewing, a read-only browser for navigating an InterLace.

The software is structured so that (2) can run independent of all
server infrastructure, ie. from offline media like SD cards.


## Installation

Install dependencies

```sudo apt-get install nodejs npm
npm install socket.io
```

Clone the repository and submodules

```git clone https://github.com/strob/interlace.git
cd interlace
git submodule init
```


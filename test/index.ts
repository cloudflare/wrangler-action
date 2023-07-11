type Env = {
  SECRET1: string
  SECRET2: string
}

export default {
  fetch(request: Request, env: Env) {
    const url = new URL(request.url)


    if (url.pathname === "/secret") {
      let sec1 = (typeof env.SECRET1 !== 'undefined') ? env.SECRET1 : ""
      let sec2 = (typeof env.SECRET2 !== 'undefined') ? env.SECRET2 : ""
      return new Response(`${sec1} ${sec2}`)
    }


    return new Response(JSON.stringify({ ...request, ...Object.fromEntries(request.headers.entries()) }, null, '\t'), { headers: { 'Content-Type': 'application/json' } });
  }
}
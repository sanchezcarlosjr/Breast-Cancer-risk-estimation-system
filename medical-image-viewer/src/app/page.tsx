"use client"; 
import styles from './page.module.css'
import { useState, useEffect } from 'react'


export default function Home() {
  const [images, setData] = useState(null)
  const [isLoading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    const path = new URLSearchParams(document.location.search).get("path");
    if (!path) {
      setLoading(false);
      return;
    }
    fetch(`/api/images?path=${path}`)
      .then((res) => res.json())
      .then((images) => {
        setData(images)
        setLoading(false)
      })
  }, [])

  if (isLoading) return <p>Loading...</p>
  if (!images || images.length === 0) return <p>No images</p>

  return (
    <main className={styles.main}>
       {images.map(image => (<div key={image.local_location}> {image.local_location.replace("public", "")} </div>))}
    </main>
  )
}

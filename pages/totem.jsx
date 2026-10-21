import Head from 'next/head';
import GaleneStore from '../components/store/GaleneStore';

// iPad da loja: mesma vitrine, em modo totem (ver GaleneStore).
export default function Totem() {
  return (
    <>
      <Head><meta name="robots" content="noindex" /></Head>
      <GaleneStore totem />
    </>
  );
}

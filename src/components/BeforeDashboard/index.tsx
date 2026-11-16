import { Banner } from '@payloadcms/ui/elements/Banner'
import React from 'react'

import './index.scss'

const baseClass = 'before-dashboard'

const BeforeDashboard: React.FC = () => {
  return (
    <div className={baseClass}>
      <Banner className={`${baseClass}__banner`} type="success">
        <h4>Welkom in je dashboard</h4>
      </Banner>
      <ul className={`${baseClass}__instructions`}>
        <li>
          {"Bewerk je pagina's onder "}
          <strong>{"Pagina's"}</strong>
          {'. Wijzigingen worden automatisch als concept bewaard; klik op '}
          <strong>Publiceren</strong>
          {' om ze online te zetten.'}
        </li>
        <li>
          {'Adres, openingsuren en sociale media pas je aan onder '}
          <strong>Instellingen → Bedrijfsgegevens</strong>.
        </li>
        <li>
          <a href="/" rel="noopener noreferrer" target="_blank">
            Bekijk je website
          </a>
        </li>
      </ul>
    </div>
  )
}

export default BeforeDashboard

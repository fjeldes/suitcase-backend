import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Terms, TermsType } from './entities/terms.entity';
import { UserTermsAcceptance } from './entities/user-terms-acceptance.entity';

const DEFAULT_TERMS: Record<TermsType, string> = {
  [TermsType.CLIENT]: `TÉRMINOS Y CONDICIONES — USUARIO

Última actualización: Junio 2026

1. ACEPTACIÓN DE LOS TÉRMINOS
Al acceder o utilizar la aplicación KipGo ("la Plataforma"), usted acepta cumplir y estar legalmente vinculado por estos Términos y Condiciones. Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestros servicios.

2. INFORMACIÓN DE KIPGO
KipGo SpA, sociedad constituida bajo las leyes de la República de Chile, RUT pendiente, domicilio en Santiago, Chile. Correo electrónico de contacto: legal@kipgo.app.

3. DEFINICIONES
- "Plataforma": la aplicación móvil KipGo y su sitio web asociado.
- "Usuario" o "Cliente": toda persona que utilice la Plataforma para almacenar su equipaje.
- "Anfitrión": establecimiento comercial que ofrece espacio de almacenamiento a través de la Plataforma.
- "Personal": persona autorizada por el Anfitrión para operar la Plataforma en su nombre.
- "Equipaje": maletas, bolsos y artículos personales del Usuario depositados para almacenamiento.
- "Check-in": momento en que el Usuario entrega su equipaje al Anfitrión.
- "Check-out": momento en que el Usuario retira su equipaje del Anfitrión.

4. DESCRIPCIÓN DEL SERVICIO
4.1. KipGo es una plataforma tecnológica que conecta a Usuarios con Anfitriones para el almacenamiento temporal de equipaje.
4.2. KipGo actúa únicamente como intermediario facilitando las reservas, pagos y comunicación entre las partes. No presta directamente el servicio de almacenamiento ni tiene la custodia del equipaje.
4.3. La relación contractual para el servicio de almacenamiento se establece directamente entre el Usuario y el Anfitrión.

5. REGISTRO Y CUENTA
5.1. Para utilizar la Plataforma debe crear una cuenta proporcionando información veraz, completa y actualizada.
5.2. Usted es el único responsable de mantener la confidencialidad de sus credenciales de acceso.
5.3. Debe notificar inmediatamente a KipGo cualquier uso no autorizado de su cuenta.
5.4. Se permite una sola cuenta por persona. La creación de cuentas múltiples o el uso de identidades falsas será causal de terminación inmediata.
5.5. KipGo se reserva el derecho de verificar su identidad y rechazar registros sin necesidad de expresión de causa.

6. RESERVAS Y PAGOS
6.1. Al realizar una reserva, usted autoriza expresamente el cargo del monto total correspondiente al servicio contratado.
6.2. Todos los precios se muestran en pesos chilenos (CLP) e incluyen el Impuesto al Valor Agregado (IVA) cuando corresponda, de conformidad con la legislación tributaria chilena.
6.3. El pago se procesa al momento de la reserva a través de Stripe, Inc., procesador de pagos internacional que cumple con los estándares PCI-DSS.
6.4. KipGo emitirá y enviará un comprobante electrónico o boleta por cada transacción realizada, conforme a las normas del Servicio de Impuestos Internos (SII).
6.5. Al precio publicado por el Anfitrión se le agrega una tarifa de servicio del 15% que KipGo cobra al Usuario por el uso de la Plataforma. El total a pagar por el Usuario incluye esta tarifa y el IVA correspondiente, tal como se muestra en el desglose de precios antes de confirmar la reserva.
6.6. Las extensiones de tiempo están sujetas a disponibilidad del Anfitrión y generarán cargos adicionales proporcionales al tiempo extendido.

7. POLÍTICA DE CANCELACIONES Y REEMBOLSOS
7.1. Cancelaciones realizadas antes del check-in: reembolso completo del monto pagado, sin descuentos ni penalizaciones.
7.2. Cancelaciones realizadas después del check-in: no procede reembolso, salvo acuerdo entre las partes.
7.3. El reembolso se procesará dentro de un plazo de 5 a 10 días hábiles, abonándose al método de pago original.
7.4. En caso de que el Anfitrión cancele una reserva ya confirmada, el Usuario tendrá derecho a reembolso completo del monto pagado. KipGo no otorgará créditos, compensaciones ni indemnizaciones adicionales por cancelaciones del Anfitrión.
7.5. KipGo se reserva el derecho de cancelar reservas por causas de fuerza mayor o caso fortuito, con reembolso completo para el Usuario.

8. ARTÍCULOS PROHIBIDOS
Queda estrictamente prohibido almacenar:
- Armas de fuego, municiones, explosivos o materiales inflamables
- Sustancias estupefacientes, psicotrópicas o contrabando en general
- Alimentos perecederos, sustancias biológicas peligrosas o animales vivos
- Dinero en efectivo, cheques, valores negociables, joyas, obras de arte o cualquier objeto de valor
- Documentos personales originales (pasaportes, cédulas de identidad, títulos, escrituras)
- Material pornográfico, discriminatorio o que promueva la violencia
- Cualquier artículo cuya tenencia, transporte o almacenamiento sea ilegal según la legislación chilena

El incumplimiento de esta cláusula facultará a KipGo y al Anfitrión a dar por terminada la reserva de inmediato, sin derecho a reembolso, y a poner los artículos a disposición de las autoridades competentes.

9. EXTENSIÓN DEL SERVICIO Y EQUIPAJE NO RETIRADO
9.1. El Usuario podrá solicitar una extensión del período de almacenamiento directamente desde la aplicación, sujeta a disponibilidad y aprobación del Anfitrión.
9.2. Si el Usuario no retira su equipaje dentro del período contratado ni solicita una extensión, se aplicará un cargo automático equivalente al valor de un día adicional por cada día de retraso, facturado al método de pago registrado.
9.3. Transcurridos 7 días corridos desde la fecha de check-out sin que el Usuario haya retirado su equipaje, el equipaje se considerará abandonado.
9.4. En caso de abandono, KipGo y el Anfitrión intentarán contactar al Usuario por todos los medios disponibles (correo electrónico, teléfono, notificación push) otorgando un plazo adicional de 5 días hábiles para el retiro.
9.5. Vencido el plazo anterior sin respuesta, el Anfitrión podrá disponer del equipaje según la legislación chilena aplicable, incluyendo su donación o destrucción, sin derecho a compensación para el Usuario.

10. OBLIGACIONES DEL USUARIO
10.1. Proporcionar información precisa y veraz sobre el contenido de su equipaje al momento de la reserva.
10.2. Retirar el equipaje dentro del período contratado.
10.3. Cumplir con las normas, horarios y políticas del establecimiento Anfitrión.
10.4. Indemnizar y mantener indemne a KipGo y al Anfitrión por cualquier daño, pérdida o perjuicio causado por el incumplimiento de estas condiciones o por el contenido de su equipaje.
10.5. No ceder ni transferir sus derechos u obligaciones derivados de una reserva sin el consentimiento previo y por escrito de KipGo.

11. DECLARACIÓN DE VALOR Y RESPONSABILIDAD DEL USUARIO
11.1. El Usuario declara bajo juramento que el contenido de su equipaje no incluye artículos de alto valor no declarados, entendiendo por tales: joyas, relojes, obras de arte, antigüedades, dinero en efectivo, instrumentos musicales profesionales, equipos electrónicos de alto valor (cámaras profesionales, laptops, tablets) cuyo valor unitario exceda los $200 USD.
11.2. El Usuario tiene la obligación de declarar expresamente cualquier artículo de alto valor contenido en su equipaje al momento de realizar la reserva. La falta de declaración libera al Anfitrión y a KipGo de toda responsabilidad por pérdida o daño de dichos artículos.
11.3. Al realizar la declaración, el Usuario deberá especificar el tipo de artículo y su valor estimado. El Anfitrión podrá aceptar o rechazar la custodia de artículos de alto valor a su sola discreción.
11.4. Para artículos declarados, la responsabilidad del Anfitrión se limita al valor declarado, con un tope máximo de $200 USD por artículo y $500 USD por reserva.
11.5. El Usuario podrá contratar un seguro de viaje o de equipaje por cuenta propia si el valor de sus pertenencias excede estos montos.

12. PROCEDIMIENTO DE RECLAMOS
12.1. Cualquier reclamo por pérdida, daño o incidencia debe ser reportado por el Usuario al Anfitrión directamente dentro de las 24 horas siguientes al check-out, y en copia a KipGo al correo legal@kipgo.app.
12.2. El Anfitrión y el Usuario acuerdan resolver sus controversias directamente entre sí, sin intervención de KipGo.
12.3. KipGo no tiene la obligación de investigar, mediar ni resolver controversias entre Usuarios y Anfitriones, pero podrá ofrecer, a su sola discreción, facilitar la comunicación entre las partes.
12.4. En caso de no llegar a un acuerdo directo, las partes deberán someter sus controversias a arbitraje ante el Centro de Arbitraje y Mediación de la Cámara de Comercio de Santiago, de conformidad con su Reglamento Procesal. El laudo arbitral será definitivo e inapelable. Esto no aplica a controversias que, por su naturaleza, deban ser conocidas por los tribunales de justicia según la Ley N° 19.496.
12.5. Cada parte asumirá sus propios costos de arbitraje, honorarios de abogados y demás gastos derivados del reclamo.

13. RESPONSABILIDAD — EXENCIÓN TOTAL DE KIPGO
13.1. KipGo actúa EXCLUSIVAMENTE como facilitador tecnológico. Bajo ninguna circunstancia KipGo presta servicios de almacenamiento, custodia ni tiene la posesión material del equipaje.
13.2. KIPGO NO ASUME RESPONSABILIDAD ALGUNA POR PÉRDIDA, DAÑO, HURTO, DESTRUCCIÓN, EXTRAVÍO O CUALQUIER OTRO PERJUICIO RELACIONADO CON EL EQUIPAJE O SU CONTENIDO. EL USUARIO Y EL ANFITRIÓN ASUMEN TODA LA RESPONSABILIDAD DERIVADA DEL SERVICIO DE ALMACENAMIENTO.
13.3. El Usuario reconoce y acepta que utiliza la Plataforma BAJO SU PROPIO RIESGO. La Plataforma se proporciona "TAL CUAL" ("AS IS") Y "SEGÚN DISPONIBILIDAD" ("AS AVAILABLE"), sin garantías de ningún tipo, expresas o implícitas.
13.4. KipGo no será responsable bajo ninguna circunstancia por daños directos, indirectos, emergentes, punitivos, pérdida de oportunidades, lucro cesante, pérdida de datos, ni por ningún otro tipo de daño, incluso si se hubiera advertido de la posibilidad de dichos daños.
13.5. El Anfitrión asume TODA LA RESPONSABILIDAD directa, exclusiva e ilimitada por el cuidado, custodia, conservación y devolución del equipaje durante todo el período de almacenamiento, incluyendo cualquier extensión del mismo.
13.6. EN NINGÚN CASO LA RESPONSABILIDAD TOTAL DE KIPGO, POR CUALQUIER CAUSA, EXCEDERÁ EL MONTO TOTAL EFECTIVAMENTE PAGADO POR EL USUARIO POR LA RESERVA ESPECÍFICA QUE DIO ORIGEN AL RECLAMO.

14. PROPIEDAD INTELECTUAL
14.1. Todos los derechos de propiedad intelectual sobre la Plataforma, incluyendo su diseño, código fuente, logotipos, marcas comerciales, nombres de dominio y contenido, son propiedad exclusiva de KipGo o de sus licenciantes.
14.2. Queda estrictamente prohibida la reproducción, distribución, modificación, descompilación o ingeniería inversa de la Plataforma sin autorización previa y por escrito de KipGo.
14.3. El Usuario no adquiere ningún derecho de propiedad intelectual sobre la Plataforma por el mero hecho de utilizarla.

15. SUSPENSIÓN Y TERMINACIÓN
15.1. KipGo puede suspender o terminar su cuenta de forma inmediata en caso de:
- Violación de cualquiera de estos términos
- Actividad fraudulenta, engañosa o ilegal
- Conducta que pueda dañar la reputación de KipGo, sus Anfitriones u otros Usuarios
- Inactividad prolongada de la cuenta por más de 12 meses consecutivos
15.2. En caso de terminación, las reservas vigentes serán canceladas con reembolso proporcional.
15.3. El Usuario podrá solicitar la eliminación de su cuenta en cualquier momento enviando un correo a legal@kipgo.app.

16. FUERZA MAYOR Y CASO FORTUITO
KipGo no será responsable por el incumplimiento o retraso en el cumplimiento de sus obligaciones cuando dicho incumplimiento sea causado por eventos fuera de su control razonable, incluyendo pero no limitado a: terremotos, incendios, inundaciones, pandemias, huelgas, actos de terrorismo, disturbios civiles, fallas en servicios de terceros (Stripe, Google Cloud, AWS), cortes de energía o internet, o cualquier acto de autoridad gubernamental.

17. PROTECCIÓN AL CONSUMIDOR
Estos Términos y Condiciones se otorgan sin perjuicio de los derechos que le corresponden al Usuario en su calidad de consumidor, de conformidad con la Ley N° 19.496 sobre Protección de los Derechos de los Consumidores y sus modificaciones. En caso de conflicto entre estos términos y la ley aplicable, prevalecerán las disposiciones legales imperativas.

18. LEY APLICABLE Y JURISDICCIÓN
18.1. Estos Términos se rigen íntegramente por las leyes de la República de Chile.
18.2. Cualquier controversia derivada de estos términos será sometida a los tribunales ordinarios de justicia de la ciudad de Santiago, Chile, con exclusión de cualquier otro fuero o jurisdicción.
18.3. Para controversias de carácter masivo o que involucren derechos del consumidor, las partes podrán someterse a mediación previa ante la Corporación de Asistencia Judicial o al arbitraje establecido en la Ley N° 19.496.

19. MODIFICACIONES
19.1. KipGo se reserva el derecho de modificar estos términos en cualquier momento.
19.2. Los cambios serán notificados a través de la aplicación o por correo electrónico con al menos 15 días de anticipación a su entrada en vigencia.
19.3. El uso continuado de la Plataforma después de la entrada en vigencia de las modificaciones constituye aceptación expresa de los nuevos términos. Si no está de acuerdo, debe dejar de utilizar la Plataforma y solicitar la cancelación de su cuenta.

20. CONTACTO Y NOTIFICACIONES
Para cualquier consulta, reclamo o notificación relacionada con estos términos:
- Correo electrónico: legal@kipgo.app
- A través del formulario de contacto en la aplicación
- Las notificaciones legales se enviarán al correo electrónico registrado por el Usuario en su cuenta`,

  [TermsType.OWNER]: `TÉRMINOS Y CONDICIONES — ANFITRIÓN

Última actualización: Junio 2026

1. DEFINICIONES
Los términos definidos en la sección 3 de los Términos y Condiciones de Usuario aplican también al presente acuerdo. "Anfitrión" se refiere al establecimiento comercial o persona natural que ofrece servicios de almacenamiento a través de la Plataforma.

2. OBLIGACIONES DEL ANFITRIÓN
2.1. Proporcionar información precisa, veraz y actualizada sobre su ubicación, capacidad de almacenamiento, horarios de atención y precios.
2.2. Mantener un área de almacenamiento segura, limpia, seca y accesible durante el horario comercial declarado.
2.3. Aceptar y honrar todas las reservas confirmadas a través de la Plataforma, sin excepción.
2.4. Estar disponible durante el horario comercial declarado para realizar check-in y check-out.
2.5. Verificar la identidad del Usuario antes de entregar el equipaje, solicitando la confirmación de la reserva en la aplicación.
2.6. Tomar fotografías del equipaje durante el check-in como respaldo para ambas partes.
2.7. Mantener actualizada la disponibilidad de su local en tiempo real.

3. COMISIONES Y PAGOS
3.1. KipGo cobrará una comisión del 18% sobre el precio publicado por el Anfitrión por cada reserva completada. Este porcentaje podrá ser modificado con aviso previo de 30 días.
3.2. Los pagos se procesarán dentro de los 2 días hábiles posteriores al check-out exitoso.
3.3. Los pagos se realizan a través de Stripe Connect a la cuenta bancaria registrada por el Anfitrión. El Anfitrión es responsable de mantener sus datos bancarios actualizados.
3.4. El Anfitrión es responsable del cumplimiento de todas sus obligaciones tributarias derivadas de los ingresos generados a través de la Plataforma, incluyendo el impuesto de primera categoría, IVA, pagos provisionales mensuales y cualquier otro impuesto aplicable según la legislación chilena.
3.5. KipGo emitirá una factura electrónica por la comisión cobrada, de conformidad con las normas del SII. El Anfitrión deberá, a su vez, emitir boleta o factura electrónica al Usuario final por el servicio de almacenamiento prestado.

4. SEGURO Y COBERTURA — RESPONSABILIDAD DIRECTA DEL ANFITRIÓN
4.1. El Anfitrión es el único y exclusivo responsable directo del cuidado, custodia, conservación y devolución del equipaje durante todo el período de almacenamiento, incluyendo cualquier extensión del mismo. El Usuario confía sus pertenencias al Anfitrión, no a KipGo.
4.2. En caso de pérdida, daño, hurto o destrucción del equipaje o su contenido durante el período de almacenamiento, el Anfitrión está OBLIGADO a compensar directamente al Usuario. El monto de compensación será el menor entre: (a) el valor real de los artículos perdidos o dañados, debidamente acreditado por el Usuario mediante facturas o comprobantes; (b) el valor total de la reserva multiplicado por 5; con un tope máximo de $200 USD (o su equivalente en CLP) por reserva.
4.3. ES OBLIGACIÓN EXCLUSIVA DEL ANFITRIÓN contar con su propio seguro comercial o póliza de responsabilidad civil que cubra la custodia de bienes de terceros para responder ante estos eventos.
4.4. Cualquier pérdida, daño, hurto o incidente debe ser reportado por el Anfitrión al Usuario dentro de las 24 horas siguientes, con copia a KipGo al correo legal@kipgo.app. La falta de reporte oportuno hará responsable al Anfitrión por el valor total del reclamo.
4.5. El Anfitrión se obliga a colaborar plenamente con el Usuario para resolver cualquier incidente, proporcionando fotografías, registros de cámaras, testigos y cualquier otra evidencia disponible.
4.6. Si un Anfitrión es declarado responsable por pérdida o daño y no compensa al Usuario dentro de los 10 días hábiles siguientes, KipGo podrá suspender su cuenta de forma inmediata y retener los pagos pendientes para destinarlos a la compensación del Usuario.
4.7. Dos o más incidentes de pérdida o daño no resueltos resultarán en la desactivación permanente del Anfitrión de la Plataforma.
4.8. KipGo podrá ofrecer en el futuro un servicio opcional de seguro de equipaje contratable directamente por los Usuarios y Anfitriones dentro de la Plataforma, el cual estará sujeto a sus propios términos y condiciones.
4.9. El Anfitrión acepta expresamente que KipGo no tiene responsabilidad alguna por pérdidas, daños o perjuicios sufridos por el equipaje de los Usuarios. El Anfitrión renuncia expresamente a cualquier acción de repetición, subrogación o indemnización contra KipGo derivada de reclamos de Usuarios.

5. OPERACIÓN Y PRECIOS
5.1. Mantener actualizada la disponibilidad en tiempo real. La disponibilidad declarada se considera vinculante para efectos de las reservas.
5.2. Los precios pueden ser modificados en cualquier momento, pero las reservas ya confirmadas se respetarán al precio vigente al momento de la confirmación.
5.3. El Anfitrión solo puede cancelar reservas confirmadas en circunstancias excepcionales debidamente justificadas (emergencias, fuerza mayor, cierre temporal).
5.4. Las cancelaciones injustificadas por parte del Anfitrión resultarán en una penalización equivalente al 15% del valor de la reserva cancelada y podrán afectar su clasificación dentro de la Plataforma.
5.5. En caso de múltiples cancelaciones injustificadas, KipGo podrá suspender o terminar la cuenta del Anfitrión.

6. EQUIPAJE ABANDONADO
6.1. Si un Usuario no retira su equipaje en la fecha de check-out, el Anfitrión deberá contactar a KipGo inmediatamente.
6.2. KipGo intentará contactar al Usuario y gestionar el retiro del equipaje.
6.3. Transcurridos 7 días desde el check-out sin que el Usuario retire su equipaje, el Anfitrión podrá seguir las instrucciones de KipGo para la disposición del equipaje según la legislación chilena aplicable.
6.4. El Anfitrión no podrá disponer del equipaje abandonado sin la autorización expresa de KipGo.

7. PROHIBICIONES
El Anfitrión no debe bajo ninguna circunstancia:
- Discriminar a Usuarios por razón de raza, etnia, género, religión, orientación sexual, identidad de género, nacionalidad, discapacidad o cualquier otra condición protegida por la ley chilena
- Solicitar, aceptar o realizar pagos fuera de la Plataforma (para evitar la evasión de comisiones e impuestos)
- Modificar los precios o condiciones después de que una reserva haya sido confirmada
- Almacenar artículos prohibidos según la cláusula 8 de los Términos de Usuario
- Subarrendar, ceder o transferir sus derechos como Anfitrión sin autorización de KipGo
- Utilizar los datos de contacto de los Usuarios para fines no relacionados con el servicio de almacenamiento

8. EVALUACIÓN Y CALIFICACIONES
8.1. Los Usuarios podrán calificar y reseñar a los Anfitriones después de cada reserva completada.
8.2. Las calificaciones son públicas y visibles para todos los Usuarios de la Plataforma.
8.3. KipGo se reserva el derecho de eliminar calificaciones fraudulentas o que violen estas políticas.
8.4. Los Anfitriones con calificaciones promedio inferiores a [3.0 estrellas] durante un período sostenido podrán ser suspendidos o dados de baja de la Plataforma.

9. TERMINACIÓN
KipGo puede suspender o terminar la cuenta del Anfitrión de forma inmediata por:
- Violaciones reiteradas de estos términos
- Actividad fraudulenta o engañosa
- Calificaciones promedio inferiores al mínimo establecido
- Proporcionar información falsa o engañosa
- Incumplimiento grave de las obligaciones de custodia
- Realizar pagos o cobros fuera de la Plataforma
- Cualquier conducta que, a juicio de KipGo, pueda dañar su reputación o la de la Plataforma

10. EXCLUSIVIDAD
Durante la vigencia de este acuerdo, el Anfitrión se compromete a no publicar ni ofrecer su espacio de almacenamiento en plataformas competidoras sin la autorización previa y por escrito de KipGo.

11. LEY APLICABLE Y JURISDICCIÓN
11.1. Estos términos se rigen por las leyes de la República de Chile.
11.2. Cualquier controversia será sometida a los tribunales ordinarios de justicia de Santiago, Chile.
11.3. Para consultas: legal@kipgo.app`,

  [TermsType.STAFF]: `TÉRMINOS Y CONDICIONES — PERSONAL

Última actualización: Junio 2026

1. ALCANCE DEL ACCESO
Como miembro del Personal autorizado por un Anfitrión, se le otorga acceso limitado a la Plataforma exclusivamente para:
- Visualizar las reservas correspondientes a la ubicación asignada
- Realizar check-in y check-out de equipaje
- Comunicarse con los Usuarios respecto a sus reservas activas
- Tomar fotografías de respaldo del equipaje durante el check-in
- Actualizar el estado de las reservas según las acciones realizadas

2. RESPONSABILIDADES
2.1. Usar la aplicación únicamente para los fines autorizados expresamente por el Anfitrión.
2.2. Verificar la identidad del Usuario antes de entregar cualquier artículo.
2.3. Registrar con precisión los horarios de check-in y check-out en la aplicación.
2.4. Reportar cualquier incidencia, pérdida o daño al Anfitrión y a KipGo de forma inmediata.
2.5. Mantener la confidencialidad de la información de los Usuarios.

3. RESTRICCIONES
El Personal NO puede bajo ninguna circunstancia:
- Acceder o modificar la configuración, precios o condiciones del local
- Visualizar datos financieros, ingresos o comisiones
- Crear, cancelar o modificar reservas existentes
- Invitar, agregar o gestionar otros miembros del Personal
- Compartir sus credenciales de acceso con terceros
- Utilizar la cuenta del Anfitrión sin su autorización expresa
- Realizar check-out sin verificar previamente la identidad del Usuario

4. RESPONSABILIDAD
4.1. El Anfitrión que otorgó el acceso es responsable solidario por las acciones del Personal bajo su supervisión.
4.2. Las violaciones a estas restricciones resultarán en la terminación inmediata del acceso, sin perjuicio de las acciones legales que correspondan.
4.3. KipGo no será responsable por acciones u omisiones del Personal.
4.4. El acceso puede ser revocado en cualquier momento por el Anfitrión o por KipGo, sin necesidad de expresión de causa.

5. PRIVACIDAD Y CONFIDENCIALIDAD
5.1. El Personal solo puede acceder a los datos de los Usuarios que sean estrictamente necesarios para sus funciones operativas.
5.2. Toda la información de los Usuarios debe mantenerse estrictamente confidencial, incluso después de terminado el vínculo con el Anfitrión.
5.3. Queda prohibido utilizar los datos de los Usuarios para fines distintos a los establecidos en este documento.
5.4. El incumplimiento de esta cláusula podrá dar lugar a acciones legales por violación de la Ley N° 19.628 sobre Protección de la Vida Privada.

6. VIGENCIA
6.1. El acceso del Personal se mantendrá vigente mientras el Anfitrión mantenga una cuenta activa en la Plataforma y no revoque dicho acceso.
6.2. La terminación de la relación entre el Anfitrión y el Personal deberá ser notificada a KipGo dentro de los 5 días hábiles siguientes.

7. LEY APLICABLE
Estos términos se rigen por las leyes de la República de Chile. Para consultas: legal@kipgo.app`,

  [TermsType.PRIVACY]: `POLÍTICA DE PRIVACIDAD

Última actualización: Junio 2026

1. IDENTIDAD DEL RESPONSABLE
KipGo SpA, sociedad chilena, RUT pendiente, domicilio en Santiago, Chile.
Correo electrónico del Delegado de Protección de Datos: privacy@kipgo.app.

2. MARCO NORMATIVO APLICABLE
Esta Política de Privacidad se rige por:
- Ley N° 19.628 sobre Protección de la Vida Privada
- Ley N° 21.719 (Nueva Ley de Protección de Datos Personales, promulgada en 2024), que modifica y complementa la Ley N° 19.628 y se adecúa a los estándares internacionales de protección de datos
- Reglamento de la Ley N° 21.719
- Normativa del Consejo para la Transparencia
- En su defecto, y para operaciones transfronterizas, el Reglamento General de Protección de Datos (GDPR) de la Unión Europea como estándar de referencia

3. INFORMACIÓN QUE RECOPILAMOS

3.1. Información proporcionada directamente por el Usuario:
- Nombre completo, correo electrónico, número de teléfono
- Datos de perfil (foto de perfil, preferencias de idioma y notificaciones)
- Información de facturación y datos tributarios (RUT para emisión de boletas)
- Fotografías del equipaje (tomadas durante el check-in)

3.2. Información recopilada automáticamente:
- Tipo de dispositivo, sistema operativo, versión de la aplicación
- Dirección IP, ubicación geográfica aproximada (solo con consentimiento)
- Historial de reservas, interacciones y uso de la aplicación
- Identificadores de notificaciones push (Expo Push Token)
- Datos de rendimiento y errores de la aplicación

3.3. Información de pago:
Los pagos son procesados íntegramente por Stripe, Inc. (https://stripe.com/privacy). KipGo no almacena ni tiene acceso a números completos de tarjetas de crédito, códigos de seguridad (CVV) ni datos bancarios sensibles. Stripe puede compartir con KipGo información limitada como los últimos 4 dígitos de la tarjeta, marca (Visa, Mastercard, etc.), país de emisión y fecha de expiración.

4. FINALIDADES DEL TRATAMIENTO
Sus datos personales serán tratados exclusivamente para las siguientes finalidades:
- Procesar y gestionar reservas, pagos y extensiones de servicio
- Enviar confirmaciones, recibos, boletas electrónicas y notificaciones transaccionales
- Proveer soporte al cliente, atender consultas y resolver incidencias
- Cumplir con obligaciones legales, tributarias y regulatorias ante el SII y otras autoridades
- Prevenir fraudes, abusos y garantizar la seguridad de la Plataforma
- Mejorar y personalizar la experiencia del Usuario (sobre la base de interés legítimo)
- Enviar comunicaciones comerciales y promocionales, solo con el consentimiento previo del Usuario

5. BASE LEGAL DEL TRATAMIENTO
El tratamiento de sus datos personales se fundamenta en:
- La ejecución del contrato de servicios aceptado por el Usuario (Art. 4° Ley N° 19.628)
- El consentimiento libre, previo, expreso e informado del titular, otorgado al aceptar estos términos
- El interés legítimo de KipGo para mejorar sus servicios y prevenir fraudes
- El cumplimiento de obligaciones legales aplicables, especialmente las tributarias ante el SII
- La nueva Ley N° 21.719 establece además como bases el interés vital del titular, la ejecución de un mandato legal y el interés público

6. DESTINATARIOS DE LOS DATOS Y TRANSFERENCIAS
Compartimos sus datos personales exclusivamente con los siguientes destinatarios:

6.1. Destinatarios nacionales:
- Anfitriones y tiendas: datos estrictamente necesarios para procesar la reserva (nombre, teléfono)
- Autoridades competentes: cuando lo exija la ley o un requerimiento judicial

6.2. Destinatarios internacionales (transferencias):
- Stripe, Inc. (EE.UU.): procesamiento de pagos, certificado PCI-DSS Nivel 1
- Resend (EE.UU.): envío de correos electrónicos transaccionales
- Google Cloud Platform (EE.UU.): alojamiento de datos e infraestructura (región: us-east1)
- Expo (EE.UU.): servicio de notificaciones push
- Sentry (EE.UU.): monitoreo de rendimiento y errores (solo datos anonimizados)

6.3. KipGo no vende, arrienda ni cede información personal a terceros para fines comerciales no relacionados con el servicio.
6.4. Las transferencias internacionales se realizan con garantías adecuadas según lo establecido en la Ley N° 21.719, incluyendo cláusulas contractuales tipo y certificaciones de cumplimiento.

7. PLAZOS DE CONSERVACIÓN
Conservamos sus datos personales durante los siguientes períodos:
- Datos de cuenta: mientras la cuenta esté activa
- Datos transaccionales (reservas, pagos): 5 años desde la última transacción, conforme a las obligaciones tributarias chilenas (Art. 200 del Código Tributario)
- Datos de comunicación: 3 años desde la última interacción
- Datos de perfiles de Usuarios inactivos: 3 años desde la última actividad, después de lo cual serán anonimizados o eliminados
- Datos de facturación: según los plazos establecidos por el SII

8. DERECHOS DE LOS TITULARES DE DATOS
De acuerdo con la Ley N° 19.628 y la nueva Ley N° 21.719, usted tiene los siguientes derechos (Derechos ARCO+):

- Acceso: solicitar información sobre qué datos personales tenemos y cómo los tratamos
- Rectificación: solicitar la corrección de datos inexactos, incompletos o desactualizados
- Cancelación: solicitar la eliminación de sus datos cuando ya no sean necesarios para las finalidades para las que fueron recogidos
- Oposición: oponerse al tratamiento de sus datos para fines específicos, como marketing directo
- Portabilidad: solicitar la entrega de sus datos en un formato estructurado y de uso común (Ley N° 21.719)
- Bloqueo: solicitar el bloqueo temporal del tratamiento en casos específicos
- Revocación del consentimiento: revocar su consentimiento en cualquier momento, sin que ello afecte la licitud del tratamiento previo

Para ejercer estos derechos, envíe un correo a privacy@kipgo.app con el asunto "Derechos ARCO" o "Derechos ARCO+", adjuntando una copia de su cédula de identidad o pasaporte. Responderemos dentro del plazo legal de 15 días hábiles, prorrogable por 10 días adicionales en casos de especial complejidad.

Si no estamos en condiciones de dar respuesta satisfactoria, usted tiene derecho a presentar un reclamo ante el Consejo para la Transparencia (www.consejotransparencia.cl) o ante los tribunales de justicia competentes.

9. SEGURIDAD DE LOS DATOS
Implementamos las siguientes medidas de seguridad técnicas, administrativas y organizativas:
- Cifrado AES-256 para datos almacenados en reposo
- TLS 1.3 para todas las comunicaciones en tránsito
- Autenticación de dos factores (2FA) para accesos administrativos
- Auditorías periódicas de seguridad y gestión de vulnerabilidades
- Políticas de acceso basadas en el principio de mínimo privilegio
- Registro de accesos y operaciones sobre datos personales
- Capacitación anual del personal en protección de datos
- Procedimientos de notificación de violaciones de seguridad (breach notification) conforme a la Ley N° 21.719

10. MENORES DE EDAD
La Plataforma está destinada exclusivamente a mayores de 18 años. No recopilamos intencionadamente datos personales de menores de edad. Si tiene conocimiento de que un menor de 18 años nos ha proporcionado datos personales sin consentimiento parental, le rogamos nos contacte inmediatamente a privacy@kipgo.app para proceder a su eliminación.

11. DECISIONES AUTOMATIZADAS Y PERFILES
KipGo no toma decisiones basadas únicamente en el tratamiento automatizado de datos que produzcan efectos jurídicos significativos para los Usuarios. En caso de implementar sistemas de perfilado o recomendación automatizada en el futuro, se informará previamente a los Usuarios y se otorgará la opción de solicitar intervención humana.

12. MODIFICACIONES DE LA POLÍTICA DE PRIVACIDAD
Esta política puede ser actualizada periódicamente para reflejar cambios en nuestras prácticas o en la legislación aplicable. Los cambios significativos serán notificados a través de la aplicación o por correo electrónico con al menos 15 días de anticipación a su entrada en vigencia. Le recomendamos revisar esta política periódicamente.

13. CONTACTO DEL DELEGADO DE PROTECCIÓN DE DATOS
Para cualquier consulta, solicitud o reclamo relacionado con la protección de sus datos personales:
- Correo electrónico: privacy@kipgo.app
- Asunto: "Protección de Datos"
- Tiempo de respuesta estimado: 5 días hábiles

Para consultas legales generales:
- Correo electrónico: legal@kipgo.app

14. AUTORIDAD DE CONTROL
Si considera que sus derechos han sido vulnerados, puede presentar un reclamo ante:
- Consejo para la Transparencia de Chile: www.consejotransparencia.cl
- Tribunales ordinarios de justicia de Santiago, Chile`,
};

@Injectable()
export class TermsService implements OnModuleInit {
  constructor(
    @InjectRepository(Terms)
    private readonly termsRepository: Repository<Terms>,
    @InjectRepository(UserTermsAcceptance)
    private readonly acceptanceRepository: Repository<UserTermsAcceptance>,
  ) {}

  async onModuleInit() {
    for (const type of [TermsType.CLIENT, TermsType.OWNER, TermsType.STAFF, TermsType.PRIVACY]) {
      const existing = await this.termsRepository.findOne({ where: { type, isActive: true } });
      if (!existing) {
        await this.termsRepository.save({
          type,
          version: '2.0',
          content: DEFAULT_TERMS[type],
          isActive: true,
        });
        console.log(`✅ Terms "${type}" seeded`);
      }
    }
  }

  async findLatestByType(type: TermsType): Promise<Terms | null> {
    return this.termsRepository.findOne({
      where: { type, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async hasUserAccepted(userId: string, termsId: string): Promise<boolean> {
    const count = await this.acceptanceRepository.count({
      where: { user: { id: userId as any }, terms: { id: termsId } },
    });
    return count > 0;
  }

  async acceptTerms(userId: string, termsId: string): Promise<void> {
    const exists = await this.acceptanceRepository.findOne({
      where: { user: { id: userId as any }, terms: { id: termsId } },
    });
    if (!exists) {
      await this.acceptanceRepository.save({
        user: { id: userId } as any,
        terms: { id: termsId } as any,
      });
    }
  }

  async autoAcceptLatest(userId: string, type: TermsType): Promise<void> {
    const terms = await this.findLatestByType(type);
    if (terms) {
      await this.acceptTerms(userId, terms.id);
    }
  }
}
